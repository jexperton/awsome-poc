import crypto from "crypto";
import { CloudWatchLogs } from "aws-sdk";

export interface LogsParams {
  logGroupName: string;
  logStreamName: string;
  sequenceToken?: string;
}

export async function putLogEvent(
  params: LogsParams = {
    logGroupName: process.env.LOG_GROUP_NAME!,
    logStreamName: crypto.randomUUID(),
  },
  message: string
): Promise<Required<LogsParams>> {
  if (!params.sequenceToken) {
    await new CloudWatchLogs().createLogStream(params).promise();
  }
  const eventLog = await new CloudWatchLogs()
    .putLogEvents({
      ...params,
      logEvents: [{ timestamp: Date.now(), message }],
    })
    .promise();

  return {
    ...params,
    sequenceToken: eventLog.$response.data!.nextSequenceToken!,
  };
}
