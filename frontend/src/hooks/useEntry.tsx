import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import useSWR from "swr";

import { Entry, RawEntry } from "../types";

const mapEntry = (entry: RawEntry) => {
  const unmarshalled = unmarshall(entry);
  unmarshalled.date = new Date(parseInt(unmarshalled.date));
  return unmarshalled as Entry;
};

const getFetcher = (body: string) => (url: string) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })
    .then((response) => response.json())
    .then((response) => mapEntry(response.Item));

const useEntry = (url: string) => {
  return useSWR<Entry>(
    `${process.env.REACT_APP_API!}/get`,
    getFetcher(JSON.stringify(marshall({ url })))
  );
};

export default useEntry;
