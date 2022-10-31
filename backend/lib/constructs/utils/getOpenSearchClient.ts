import { ClientRequestArgs } from "node:http";
import { Client, Connection } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import aws4 from "aws4";

/**
 * See https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-clients.html#serverless-javascript 
 */
const createAwsConnector = (credentials: any, region: string) => {
  class AmazonConnection extends Connection {
    buildRequestObject(params: any): ClientRequestArgs {
      var request = super.buildRequestObject(params) as any;
      request.service = "aoss";
      request.region = region;
      var contentLength = '0';

      if (request.headers['content-length']) {
        contentLength = request.headers['content-length'];
        request.headers['content-length'] = '0';
      }

      request.headers['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
      request = aws4.sign(request, credentials);
      request.headers['content-length'] = contentLength;

      return request;
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
