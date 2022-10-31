import { TranscribeService } from "aws-sdk";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { Env } from "../RootStack";
import type { handler as transcribeFilefromS3Function } from "./Transcribe.transcribeFilefromS3";

type Input = Awaited<ReturnType<typeof transcribeFilefromS3Function>>;

const db = new DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (input: Input) => {
  const response = await new TranscribeService()
    .getTranscriptionJob({ TranscriptionJobName: `${input.jobName}` })
    .promise();

  if (response.TranscriptionJob?.TranscriptionJobStatus === "COMPLETED") {
    const [bucket, key] = response
      .TranscriptionJob!.Transcript!.TranscriptFileUri!.split("/")
      .slice(-2);

    await db.updateItem({
      TableName: input.tableName,
      Key: marshall({ url: input.url }),
      UpdateExpression:
        "SET transcriptionStatus = :s, transcriptFile = :f, transcriptFileUrl = :u ",
      ExpressionAttributeValues: marshall({
        ":s": response.TranscriptionJob?.TranscriptionJobStatus,
        ":f": { bucket, key },
        ":u": `https://${process.env[Env.TRANSCRIPT_DIST]}/${key}`,
      }),
    });
  }

  return {
    ...input,
    status: response.TranscriptionJob!.TranscriptionJobStatus!,
  };
};
