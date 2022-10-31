import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { S3 } from "@aws-sdk/client-s3";
import {
  ComprehendClient,
  DetectEntitiesCommand,
  LanguageCode,
} from "@aws-sdk/client-comprehend";

import { Env } from "../RootStack";
import { getOpenSearchClient } from "./utils/getOpenSearchClient";
import type { handler as updateTranscriptStatusFunction } from "./Transcribe.updateTranscriptStatus";

type Input = Awaited<ReturnType<typeof updateTranscriptStatusFunction>>;

const index = process.env[Env.SEARCH_INDEX]!;
const tableName = process.env[Env.DYNAMODB_TABLE_NAME]!;
const endpoint = `https://${process.env[Env.OPENSEARCH_ENDPOINT]}`;
const db = new DynamoDB({ region: process.env.AWS_REGION });
const s3 = new S3({ region: process.env.AWS_REGION });

export const handler = async (input: Input) => {
  // retrieve item from DynamoDB
  const item = unmarshall(
    (
      await db.getItem({
        TableName: tableName,
        Key: marshall({ url: input.url }),
      })
    ).Item!
  );

  // download transcription file from S3
  const data = await s3.getObject({
    Bucket: item.transcriptFile.bucket,
    Key: item.transcriptFile.key,
  });
  const transcription = JSON.parse(await data.Body!.transformToString());

  // extract entities from transcription with Comprehend
  const entities = await new ComprehendClient({
    region: process.env.AWS_REGION,
  }).send(
    new DetectEntitiesCommand({
      Text: transcription.results.transcripts[0].transcript,
      LanguageCode: LanguageCode.EN,
    })
  );

  // add data to OpenSearch
  const response = await (
    await getOpenSearchClient(endpoint, process.env.AWS_REGION!)
  ).index({
    id: item.uuid,
    index,
    body: {
      transcript: transcription.results.transcripts[0].transcript,
      transcriptUrl: item.transcriptFileUrl,
      title: item.title,
      media: item.url,
      date: item.date,
      items: item.transcriptFile,
      entities: entities.Entities || [],
    },
    refresh: true,
  });

  return response;
  /*
} catch (err) {
  return JSON.stringify(err);
  const response = await client.indices.create({ index });
}*/
};
