import TranscribeService from "aws-sdk/clients/transcribeservice";

type Event = {
  bucket: string;
  url: string;
};

export const handler = async (event: Event) => {
  const VocabularyName = "common";
  const LanguageCode = "en-US";

  let vocabulary = await new TranscribeService()
    .getVocabulary({ VocabularyName }, (err, data) => {
      return err
        ? new TranscribeService()
            .createVocabulary({ VocabularyName, LanguageCode })
            .promise()
        : data;
    })
    .promise();

  console.log(event);
  console.log(vocabulary);

  //new TranscribeService().createVocabulary

  return 200;
};
