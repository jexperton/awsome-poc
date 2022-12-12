import { ClientRequestArgs } from "node:http";
import { Client, Connection } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import aws4 from "aws4";

const createAwsConnector = (credentials: any, region: string) => {
  class AmazonConnection extends Connection {
    buildRequestObject(params: any): ClientRequestArgs {
      const request = super.buildRequestObject(params) as any;
      request.service = "es";
      request.region = region;
      request.headers = request.headers || {};
      request.headers["host"] = request.hostname;

      return aws4.sign(request, credentials);
    }
  }
  return { Connection: AmazonConnection };
};

export const getOpenSearchClient = async (host: string, region: string) => {
  const credentials = await defaultProvider()();
  return new Client({
    ...createAwsConnector(credentials, region),
    node: host,
  });
};
