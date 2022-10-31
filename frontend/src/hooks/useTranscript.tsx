import useSWR from "swr";

import { RawTranscription, Transcription } from "../types";

const mapTranscript = ({
  jobName,
  results,
  status,
}: RawTranscription): Transcription => ({
  jobName,
  status,
  results: {
    transcripts: results.transcripts,
    items: results.items.map((item) => ({
      start_time: parseFloat(item.start_time),
      end_time: parseFloat(item.end_time),
      alternatives: item.alternatives.map(({ confidence, content }) => ({
        content,
        confidence: parseFloat(confidence) * 100,
      })),
      type: item.type,
    })),
  },
});

const fetcher = (url: string) =>
  fetch(url)
    .then((response) => response.text())
    .then(JSON.parse)
    .then(mapTranscript);

const useTranscript = (url: string) => {
  return useSWR<Transcription>(url, fetcher);
};

export default useTranscript;
