import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IResource, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";

import { Env } from "../../RootStack";
import {
  integrationResponseParameters,
  methodResponseParameters,
} from "../utils/corsOptions";

interface VocabularyListProps {
  name: string;
  bucket: IBucket;
}

export class VocabularyListConstruct extends Construct {
  nodeJsConfig: { runtime: Runtime; memorySize: number; timeout: Duration };
  props: VocabularyListProps;
  scope: Construct;
  handler: NodejsFunction;
  id: string;

  constructor(scope: Construct, id: string, props: VocabularyListProps) {
    super(scope, id);

    this.nodeJsConfig = {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(30),
    };
    this.props = props;
    this.scope = scope;
    this.id = id;
    this.handler = this.getHandler("listVocabulary");
  }

  integrateTo(resource: IResource) {
    const credentialsRole = new Role(this, `APIGatewayRole`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.handler.grantInvoke(credentialsRole);

    resource.addMethod(
      "GET",
      new LambdaIntegration(this.handler, {
        proxy: false,
        credentialsRole,
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: { "application/json": "" },
            responseParameters: integrationResponseParameters,
          },
          { statusCode: "500", responseTemplates: { "application/json": "" } },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: methodResponseParameters,
          },
          { statusCode: "500" },
        ],
      }
    );
  }

  /**
   *
   */
  private getHandler(functionName: string) {
    const serviceRole = new Role(this.scope, `${functionName}LambdaRole`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
    });

    const lambdaFunction = new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      role: serviceRole,
      environment: {
        [Env.BUCKET_NAME]: this.props.bucket.bucketName,
      },
    });

    this.props.bucket.grantRead(lambdaFunction);

    return lambdaFunction;
  }
}
