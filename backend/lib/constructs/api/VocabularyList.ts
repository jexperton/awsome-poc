import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IRestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import { Env } from "../../RootStack";
import { IBucket } from "aws-cdk-lib/aws-s3";

interface VocabularyListProps {
  name: string;
  bucket: IBucket;
}

export class VocabularyListConstruct extends Construct {
  nodeJsConfig: { runtime: Runtime; memorySize: number; timeout: Duration };
  props: VocabularyListProps;
  scope: Construct;
  handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: VocabularyListProps) {
    super(scope, id);

    this.nodeJsConfig = {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(30),
    };
    this.props = props;
    this.scope = scope;
    this.handler = this.getHandler();
  }

  integrateTo(restApi: IRestApi, method: "GET", path: string) {
    const integrationRole = new Role(this, "VocabularyRole", {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    restApi.root.addResource(path).addMethod(
      method,
      new LambdaIntegration(this.handler, {
        proxy: false,
        cacheNamespace: "Vocabulary",
        credentialsRole: integrationRole,
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: { "application/json": "" },
          },
          { statusCode: "500", responseTemplates: { "application/json": "" } },
        ],
      }),
      {
        methodResponses: [
          { statusCode: "200" },
          { statusCode: "500" },
        ],
      },
    );
  }

  /**
   *
   */
  private getHandler(functionName = "handler") {
    const serviceRole = new Role(this.scope, `${functionName}Role`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
    });

    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      role: serviceRole,
      environment: {
        [Env.BUCKET_NAME]: this.props.bucket.bucketName,
      },
    })

    this.props.bucket.grantRead(lambdaFunction);

    return lambdaFunction;
  }
}
