import fetch from "node-fetch";
import S3 from "aws-sdk/clients/s3";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { Env } from "../RootStack";
import { putLogEvent } from "./utils/putLogEvent";
import type { handler as createEntry } from "./Transcribe.createEntry";

type Input = Awaited<ReturnType<typeof createEntry>>;

const db = new DynamoDB({ region: process.env.AWS_REGION });

export const handler = async (input: Input) => {
  const existing = await db.getItem({
    TableName: input.tableName,
    Key: marshall({ url: input.url }),
  });

  if (existing.Item?.audioFileUri) {
    input.logs = await putLogEvent(
      input.logs,
      `File ${input.url} has already been uploaded to S3`
    );
    return input;
  }

  const Key = input.url.split("?")[0].split("/").slice(-1)[0];
  const audioFileUri = `s3://${process.env[Env.BUCKET_NAME]!}/${Key}`;

  await new S3()
    .upload({
      Body: (await fetch(input.url)).body!,
      Bucket: process.env[Env.BUCKET_NAME]!,
      Key,
    })
    .promise();

  await db.updateItem({
    TableName: input.tableName,
    Key: marshall({ url: input.url }),
    UpdateExpression: "SET fileName = :k, audioFileUri = :s, audioFileUrl = :u",
    ExpressionAttributeValues: marshall({
      ":k": Key,
      ":s": audioFileUri,
      ":u": `https://${process.env[Env.AUDIO_DIST]}/${Key}`,
    }),
  });

  return input;
};
