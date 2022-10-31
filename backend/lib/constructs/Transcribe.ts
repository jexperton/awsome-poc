import { Duration } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Choice,
  Condition,
  StateMachine,
  Wait,
  WaitTime,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { IEventBus, Rule } from "aws-cdk-lib/aws-events";
import {
  AuthorizationType,
  AwsIntegration,
  CfnAuthorizer,
  IRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { SfnStateMachine } from "aws-cdk-lib/aws-events-targets";
import { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import { Env } from "../RootStack";
import {
  integrationResponseParameters,
  methodResponseParameters,
} from "./utils/corsOptions";

interface TranscribeProps {
  destinationBucket: IBucket;
  transcriptionDist: IDistribution;
  eventBus: IEventBus;
  openSearch: IDomain;
  index: string;
  sourceBucket: IBucket;
  audioDist: IDistribution;
  table: ITable;
}

export class TranscribeConstruct extends Construct {
  logGroup: LogGroup;
  nodeJsConfig: { runtime: Runtime; memorySize: number; timeout: Duration };
  props: TranscribeProps;
  scope: Construct;
  stateMachine: StateMachine;

  constructor(scope: Construct, id: string, props: TranscribeProps) {
    super(scope, id);

    this.logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_DAY,
    });
    this.nodeJsConfig = {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: Duration.seconds(30),
    };
    this.props = props;
    this.scope = scope;

    const waitTask = this.waitTask();

    const definition = this.createEntryTask()
      .next(this.putFileToS3Task())
      .next(this.transcribeFileFromS3Task())
      .next(waitTask)
      .next(this.updateTranscriptStatusTask())
      .next(
        new Choice(this, "Job Complete?")
          .when(Condition.stringEquals("$.status", "IN_PROGRESS"), waitTask)
          .otherwise(this.addToSearchIndex())
      );

    this.stateMachine = new StateMachine(this, "StateMachine", {
      definition,
      timeout: Duration.minutes(60),
    });
  }

  integrateTo(
    restApi: IRestApi,
    method: "POST" | "GET",
    path: string,
    authorizer: CfnAuthorizer
  ) {
    const source = "com.ab3.frontend";

    const integrationRole = new Role(this, "StartTranscriptionRole", {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.stateMachine.grantStartExecution(integrationRole);
    this.props.eventBus.grantPutEventsTo(integrationRole);

    new Rule(this, `StartTranscriptionRule`, {
      eventBus: this.props.eventBus,
      eventPattern: { source: [source] },
      targets: [new SfnStateMachine(this.stateMachine)],
    });

    restApi.root.addResource(path).addMethod(
      method,
      new AwsIntegration({
        service: "events",
        action: "PutEvents",
        integrationHttpMethod: "POST",
        options: {
          credentialsRole: integrationRole,
          requestParameters: {
            "integration.request.header.X-Amz-Target": "'AWSEvents.PutEvents'",
            "integration.request.header.Content-Type":
              "'application/x-amz-json-1.1'",
          },
          requestTemplates: {
            "application/json": JSON.stringify({
              Entries: [
                {
                  Source: source,
                  Detail: "$util.escapeJavaScript($input.body)",
                  Resources: [this.stateMachine.stateMachineName],
                  DetailType: "StateMachineInput",
                  EventBusName: this.props.eventBus.eventBusName,
                },
              ],
            }),
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: { "application/json": "" },
              responseParameters: integrationResponseParameters,
            },
          ],
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: methodResponseParameters,
          },
        ],
        authorizationType: AuthorizationType.COGNITO,
        authorizer: {
          authorizerId: authorizer.ref,
        },
      }
    );
  }

  /**
   *
   */
  createEntryTask(functionName = "createEntry") {
    const lambdaFunction = new NodejsFunction(this, functionName, {
      ...this.nodeJsConfig,
      environment: { [Env.DYNAMODB_TABLE_NAME]: this.props.table.tableName },
    });

    this.logGroup.grantWrite(lambdaFunction);
    this.props.table.grantReadWriteData(lambdaFunction);

    return new LambdaInvoke(this.scope, "Add New Entry", {
      lambdaFunction,
      inputPath: "$.detail",
      outputPath: "$.Payload",
    });
  }

  /**
   *
   */
  private putFileToS3Task(functionName = "putFileToS3") {
    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      environment: {
        [Env.BUCKET_NAME]: this.props.sourceBucket.bucketName,
        [Env.LOG_GROUP_NAME]: this.logGroup.logGroupName,
        [Env.AUDIO_DIST]: this.props.audioDist.distributionDomainName,
      },
    });

    this.props.sourceBucket.grantReadWrite(lambdaFunction);
    this.props.table.grantReadWriteData(lambdaFunction);
    this.logGroup.grantWrite(lambdaFunction);

    return new LambdaInvoke(this.scope, "Put File to S3", {
      lambdaFunction,
      outputPath: "$.Payload",
      resultPath: "$",
    });
  }

  /**
   *
   */
  private transcribeFileFromS3Task(functionName = "transcribeFileFromS3") {
    const serviceRole = new Role(this.scope, `${functionName}Role`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
      inlinePolicies: {
        main: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["transcribe:*"],
              resources: ["*"],
            }),
            new PolicyStatement({
              actions: ["s3:*"],
              resources: [this.props.destinationBucket.bucketArn],
            }),
          ],
        }),
      },
    });

    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      role: serviceRole,
      environment: {
        BUCKET_NAME: this.props.sourceBucket.bucketName,
        OUTPUT_BUCKET_NAME: this.props.destinationBucket.bucketName,
        LOG_GROUP_NAME: this.logGroup.logGroupName,
      },
    });

    this.props.sourceBucket.grantRead(lambdaFunction);
    this.props.destinationBucket.grantWrite(lambdaFunction);
    this.props.table.grantReadWriteData(lambdaFunction);
    this.logGroup.grantWrite(lambdaFunction);

    return new LambdaInvoke(this.scope, "Transcribe File from S3", {
      lambdaFunction,
      outputPath: "$.Payload",
      resultPath: "$",
    });
  }

  /**
   *
   */
  private waitTask() {
    return new Wait(this, "Wait X Seconds", {
      time: WaitTime.secondsPath("$.waitSeconds"),
    });
  }

  /**
   *
   */
  private updateTranscriptStatusTask(functionName = "updateTranscriptStatus") {
    const serviceRole = new Role(this.scope, `${functionName}Role`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
      inlinePolicies: {
        main: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["transcribe:*"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      role: serviceRole,
      environment: {
        [Env.LOG_GROUP_NAME]: this.logGroup.logGroupName,
        [Env.TRANSCRIPT_DIST]:
          this.props.transcriptionDist.distributionDomainName,
      },
    });

    this.props.table.grantReadWriteData(lambdaFunction);
    this.logGroup.grantWrite(lambdaFunction);

    return new LambdaInvoke(this.scope, "Update transcript status", {
      lambdaFunction,
      outputPath: "$.Payload",
    });
  }

  /**
   *
   */
  private addToSearchIndex(functionName = "addToSearchIndex") {
    const serviceRole = new Role(this.scope, `${functionName}Role`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
      inlinePolicies: {
        main: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["es:*"],
              resources: [`${this.props.openSearch.domainArn}/*`],
            }),
            new PolicyStatement({
              actions: ["comprehend:DetectEntities"],
              resources: [`*`],
            }),
          ],
        }),
      },
    });

    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      memorySize: 256,
      role: serviceRole,
      environment: {
        [Env.BUCKET_NAME]: this.props.sourceBucket.bucketName,
        [Env.LOG_GROUP_NAME]: this.logGroup.logGroupName,
        [Env.OPENSEARCH_ENDPOINT]: this.props.openSearch.domainEndpoint,
        [Env.SEARCH_INDEX]: this.props.index,
        [Env.DYNAMODB_TABLE_NAME]: this.props.table.tableName,
      },
    });

    this.props.destinationBucket.grantRead(lambdaFunction);
    this.props.table.grantReadData(lambdaFunction);
    this.logGroup.grantWrite(lambdaFunction);

    return new LambdaInvoke(this, "Add to search index", {
      lambdaFunction,
      outputPath: "$.Payload",
    });
  }
}
