import useSWR, { useSWRConfig } from "swr";

import { useToken } from "../components/providers/AuthProvider";

import type { Phrase } from "../types";

const getFetcher =
  <T,>(headers: HeadersInit, data?: T) =>
    (url: string) =>
      fetch(url, {
        method: data ? "POST" : "GET",
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      }).then((response) => response.json());

const useVocabulary = () => {
  const { token } = useToken();
  const { mutate } = useSWRConfig();
  const { data } = useSWR<Phrase[]>(
    `${process.env.REACT_APP_API!}/vocabulary`,
    (url: string) =>
      fetch(
        url,
        token ? { headers: { Authorization: token } } : undefined
      ).then((r) => r.json())
  );
  return {
    vocabulary: data,
    updateVocabulary: async (data: Phrase[]) =>
      mutate(
        data,
        await fetch(`${process.env.REACT_APP_API!}/vocabulary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(data),
        }).then((r) => r.json()),
        {
          optimisticData: data,
          revalidate: true,
        }
      ),
  };
};

export default useVocabulary;
