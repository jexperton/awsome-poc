import { unmarshall } from "@aws-sdk/util-dynamodb";
import useSWR from "swr";

import { Entry, RawEntry } from "../types";
import { useToken } from "../components/providers/AuthProvider";

const mapEntry = (entry: RawEntry) => {
  const unmarshalled = unmarshall(entry);
  unmarshalled.date = new Date(parseInt(unmarshalled.date));
  return unmarshalled as Entry;
};

export const sortByDateDesc = (a: Entry, b: Entry) => {
  return a.date < b.date ? 1 : -1;
};

const getFetcher = (token: string) => (url: string) =>
  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  })
    .then((response) => response.json())
    .then((response) => response.Items.map(mapEntry).sort(sortByDateDesc));

const useEntries = () => {
  const { token } = useToken();
  return useSWR<Entry[]>(
    `${process.env.REACT_APP_API!}/list`,
    getFetcher(token!)
  );
};

export default useEntries;
