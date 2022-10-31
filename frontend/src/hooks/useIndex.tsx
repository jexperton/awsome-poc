import { TranscriptionStatus } from "../types";
import { useToken } from "../components/providers/AuthProvider";
import useEntries, { sortByDateDesc } from "./useEntries";

interface InputValues {
  title: string;
  url: string;
  date: Date;
}

const useIndex = () => {
  const { token } = useToken();
  const { mutate: mutateEntries } = useEntries();

  return async (input: InputValues) => {
    await fetch(`${process.env.REACT_APP_API!}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token!,
      },
      body: JSON.stringify({
        title: input.title,
        url: input.url.trim(),
        date: `${input.date.getTime()}`,
        waitSeconds: 5,
      }),
    });
    await mutateEntries(
      (existingEntries = []) =>
        [
          {
            uuid: "",
            audioFileUrl: "",
            transcriptFileUrl: "",
            excerpt: [],
            entities: [],
            ...input,
            transcriptionStatus: TranscriptionStatus.NEW,
          },
          ...existingEntries.filter((existing) => existing.url !== input.url),
        ].sort(sortByDateDesc),
      { revalidate: false }
    );
  };
};

export default useIndex;
