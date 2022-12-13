import S3 from "aws-sdk/clients/s3";

import { Env } from "../../RootStack";

export const handler = async (data: Record<string, string>[]) => {
  try {
    await new S3()
      .upload({
        Body: data.reduce(
          (acc: string, item) =>
            acc.concat(
              `\n${Object.keys(item)
                .map((key) => item[key])
                .join("\t")}`
            ),
          "Phrase	SoundsLike	IPA	DisplayAs"
        ),
        Bucket: process.env[Env.BUCKET_NAME]!,
        Key: "vocabulary.txt",
      })
      .promise();
    return;
  } catch (err) {
    return JSON.stringify(err);
  }
};
