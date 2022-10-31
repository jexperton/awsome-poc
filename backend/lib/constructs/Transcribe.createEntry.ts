import { randomUUID } from "node:crypto";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { Env } from "../RootStack";
import { LogsParams } from "./utils/putLogEvent";

type Input = {
  title: string;
  date: string;
  url: string;
  waitSeconds: number;
  logs?: LogsParams;
};

const tableName = process.env[Env.DYNAMODB_TABLE_NAME]!;

const endpoint = process.env.AWS_SAM_LOCAL
  ? "http://host.docker.internal:8000"
  : undefined;

const db = new DynamoDB({
  endpoint,
  region: process.env.AWS_REGION,
});

export const handler = async (input: Input) => {
  const existing = await db.getItem({
    TableName: tableName,
    Key: marshall({ url: input.url }),
  });

  if (!existing.Item) {
    await db.putItem({
      TableName: tableName,
      Item: marshall({
        uuid: randomUUID(),
        title: input.title,
        url: input.url,
        date: input.date,
        transcriptionStatus: "NEW",
      }),
    });
  }

  return { ...input, tableName };
};
