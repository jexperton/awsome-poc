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

interface VocabularyUpdateProps {
  name: string;
  bucket: IBucket;
}

export class VocabularyUpdateConstruct extends Construct {
  nodeJsConfig: { runtime: Runtime; memorySize: number; timeout: Duration };
  props: VocabularyUpdateProps;
  scope: Construct;
  handler: NodejsFunction;
  id: string;

  constructor(scope: Construct, id: string, props: VocabularyUpdateProps) {
    super(scope, id);

    this.nodeJsConfig = {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(30),
    };
    this.props = props;
    this.scope = scope;
    this.id = id;
    this.handler = this.getHandler("updateVocabulary");
  }

  integrateTo(resource: IResource) {
    const credentialsRole = new Role(this, `APIGatewayRole`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.handler.grantInvoke(credentialsRole);

    resource.addMethod(
      "POST",
      new LambdaIntegration(this.handler, {
        proxy: false,
        credentialsRole,
        requestParameters: {
          "integration.request.header.Content-Type": "'application/json'",
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: integrationResponseParameters,
          },
          { statusCode: "500" },
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

    this.props.bucket.grantWrite(lambdaFunction);

    return lambdaFunction;
  }
}
