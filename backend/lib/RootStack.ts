import { CfnParameter, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { EventBus } from "aws-cdk-lib/aws-events";
import { Stream } from "aws-cdk-lib/aws-kinesis";
import { Construct } from "constructs";

import { RestApiConstruct } from "./constructs/RestApi";
import { StorageConstruct } from "./constructs/Storage";
import { PipelineConstruct } from "./constructs/Pipeline";
import { TranscribeConstruct } from "./constructs/Transcribe";
import { SearchConstruct } from "./constructs/Search";
import { ListConstruct } from "./constructs/List";
import { GetConstruct } from "./constructs/Get";
import { Repository } from "aws-cdk-lib/aws-codecommit";

interface RootProps extends StackProps {
  functionName: string;
}

export const Env = {
  DYNAMODB_TABLE_NAME: "DYNAMODB_TABLE_NAME",
  OPENSEARCH_ENDPOINT: "OPENSEARCH_ENDPOINT",
  SEARCH_INDEX: "SEARCH_INDEX",
  TRANSCRIPT_DIST: "TRANSCRIPT_CLOUDFRONT_DOMAIN",
  AUDIO_DIST: "AUDIO_CLOUDFRONT_DOMAIN",
  LOGIN_URL: "LOGIN_URL",
  REPOSITORY: "REPOSITORY",
  BUCKET_NAME: "BUCKET_NAME",
  OUTPUT_BUCKET_NAME: "OUTPUT_BUCKET_NAME",
  LOG_GROUP_NAME: "LOG_GROUP_NAME",
};

export class RootStack extends Stack {
  constructor(scope: Construct, id: string, props?: RootProps) {
    super(scope, id, props);

    const loginUrl = new CfnParameter(this, "loginUrl", {
      type: "CommaDelimitedList",
      description: "The callback url for hosted sign-in page.",
    });

    const logoutUrl = new CfnParameter(this, "logoutUrl", {
      type: "CommaDelimitedList",
      description: "The callback url for hosted sign-in page.",
    });

    const repositoryArn = new CfnParameter(this, "repository", {
      type: "String",
      description:
        "The CodeCommit repository ARN where this project is stored.",
    });

    const branch = new CfnParameter(this, "branch", {
      type: "String",
      description: "The repository branch to checkout.",
    });

    // the CodeCommit repository where this project is stored.
    const repository = Repository.fromRepositoryArn(
      this,
      "Repository",
      repositoryArn.valueAsString
    );

    // the CDK pipeline that invokes CDK to deploy this stack.
    new PipelineConstruct(this, "Pipeline", {
      repository,
      branch: branch.valueAsString,
    });

    // the S3 buckets where audio files and transcriptions are stored
    // and Cloudfront distribution that serves these files
    const { sourceBucket, audioDist, destinationBucket, transcriptionDist } =
      new StorageConstruct(this, "Storage");

    // the Kinesis stream where DynamoDB captured data changes are sent.
    const stream = new Stream(this, "Stream");

    // the DynamoDB table where audio files are tracked
    const table = new Table(this, "TranscriptionsTable", {
      partitionKey: { name: "url", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      kinesisStream: stream,
    });

    const domainEndpoint = new CfnParameter(this, "opensearchEndpoint", {
      type: "String",
      description: "The OpenSearch domain endpoint.",
    });

    const domainArn = new CfnParameter(this, "opensearchArn", {
      type: "String",
      description: "The OpenSearch domain ARN.",
    });

    const index = new CfnParameter(this, "opensearchIndex", {
      type: "String",
      description: "The OpenSearch index where transcriptions are indexed.",
    });

    // the OpenSearch service where transcriptions are indexed
    const openSearch = {
      domainEndpoint: domainEndpoint.valueAsString,
      domainArn: domainArn.valueAsString,
    } as IDomain;

    // the API Gateway to index and search transcriptions
    const { restApi, authorizer } = new RestApiConstruct(this, "Api", {
      loginUrl: loginUrl.valueAsList,
      logoutUrl: logoutUrl.valueAsList,
    });

    // the EventBridge bus to connect the API Gateway to Step functions
    const eventBus = new EventBus(this, "ApiEventBus", {
      eventBusName: "ApiEventBus",
    });

    // the transcription Step function
    new TranscribeConstruct(this, "TranscribeStepFunction", {
      sourceBucket,
      audioDist,
      destinationBucket,
      transcriptionDist,
      table,
      openSearch,
      index: index.valueAsString,
      eventBus,
    }).integrateTo(restApi, "POST", "add", authorizer);

    // the Lambda function that forwards search requests to OpenSearch
    new SearchConstruct(this, "Search", {
      openSearch,
      index: index.valueAsString,
    }).integrateTo(restApi, "GET", "search");

    // the API endpoint to list entries
    new ListConstruct(this, "List", { table }).integrateTo(
      restApi,
      "GET",
      "list",
      authorizer
    );

    // the API endpoint to get a specific entry
    new GetConstruct(this, "Get", { table }).integrateTo(
      restApi,
      "POST",
      "get"
    );
  }
}
