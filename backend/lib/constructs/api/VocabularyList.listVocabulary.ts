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

    return `${request.$response.data?.Body}`
      .split("\n")
      .slice(1)
      .map((line: string) => {
        const [phrase, soundsLike, ipa, displayAs] = line.split("\t");
        return { phrase, soundsLike, ipa, displayAs };
      });
  } catch (err) {
    return JSON.stringify(err);
  }
};
