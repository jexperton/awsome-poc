import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import TranscribeService from "aws-sdk/clients/transcribeservice";

import { Env } from "../RootStack";
import { putLogEvent } from "./utils/putLogEvent";
import type { handler as putFileToS3Function } from "./Transcribe.putFileToS3";

type Input = Awaited<ReturnType<typeof putFileToS3Function>>;

const db = new DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (input: Input) => {
  const result = await db.getItem({
    TableName: input.tableName,
    Key: marshall({ url: input.url }),
  });

  const item = unmarshall(result.Item!);

  if (item.transcriptionJobName) {
    if (item.transcriptionStatus === "IN_PROGRESS") {
      input.logs = await putLogEvent(
        input.logs,
        `Transcription ${item.transcriptionJobName} has already been started`
      );
      return { ...input, jobName: item.transcriptionJobName };
    }
  }

  const VocabularyName = "common";
  const LanguageCode = "en-US";
  const TranscriptionJobName = `${`${item.fileName}`
    .split("?")[0]
    .replace(".", "-")}-${parseInt(item.iteration) + 1}`;

  const job = await new TranscribeService()
    .startTranscriptionJob({
      TranscriptionJobName,
      LanguageCode,
      Settings: { VocabularyName },
      Media: { MediaFileUri: item.audioFileUri as string },
      OutputBucketName: process.env[Env.OUTPUT_BUCKET_NAME]!,
    })
    .promise();

  await db.updateItem({
    TableName: input.tableName,
    Key: { url: { S: input.url } },
    UpdateExpression:
      "SET transcriptionStatus = :s, transcriptionJobName = :n, iteration = :i",
    ExpressionAttributeValues: marshall({
      ":s": job.TranscriptionJob?.TranscriptionJobStatus,
      ":n": job.TranscriptionJob?.TranscriptionJobName,
      ":i": parseInt(item.iteration) + 1,
    }),
  });

  return { ...input, jobName: job.TranscriptionJob!.TranscriptionJobName! };
};
