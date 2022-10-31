import { Env } from "../RootStack";
import { getOpenSearchClient } from "./utils/getOpenSearchClient";

type Input = { terms: string };

const index = process.env[Env.SEARCH_INDEX]!;
const endpoint = `https://${process.env[Env.OPENSEARCH_ENDPOINT]}`;

export const handler = async (input: Input) => {
  try {
    const client = await getOpenSearchClient(endpoint, process.env.AWS_REGION!);
    const response = await client.search({
      index,
      body: {
        query: {
          match: {
            transcript: {
              query: input.terms,
              fuzziness: "AUTO",
              fuzzy_transpositions: true,
              operator: "or",
              minimum_should_match: "66%",
              analyzer: "stop",
              zero_terms_query: "none",
              lenient: false,
            },
          },
        },
        highlight: {
          fields: {
            transcript: {},
          },
        },
      },
    });
    return response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      excerpt: hit.highlight.transcript,
    }));
  } catch (err) {
    return JSON.stringify(err);
  }
};
