import S3 from "aws-sdk/clients/s3";

import { Env } from "../../RootStack";

export const handler = async () => {
  try {
    const request = await new S3()
      .getObject({
        Bucket: process.env[Env.BUCKET_NAME]!,
        Key: "vocabulary.txt",
      })
      .promise();

    return request.$response.data;
  } catch (err) {
    return JSON.stringify(err);
  }
};
