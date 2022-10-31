import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { AwsIntegration, IRestApi } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import {
  integrationResponseParameters,
  methodResponseParameters,
} from "./utils/corsOptions";

interface GetProps {
  table: ITable;
}

/**
 * This construct declares an API Gateway integration
 * with DynamoDB to retrieve a specific entry.
 */
export class GetConstruct extends Construct {
  props: GetProps;
  scope: Construct;

  constructor(scope: Construct, id: string, props: GetProps) {
    super(scope, id);
    this.props = props;
    this.scope = scope;
  }

  integrateTo(restApi: IRestApi, method: "POST", path: string) {
    const integrationRole = new Role(this, "Role", {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.props.table.grantReadData(integrationRole);

    restApi.root.addResource(path).addMethod(
      method,
      new AwsIntegration({
        service: "dynamodb",
        action: "GetItem",
        options: {
          credentialsRole: integrationRole,
          requestParameters: {
            "integration.request.header.Content-Type": "'application/json'",
          },
          requestTemplates: {
            "application/json": `{
              "TableName": "${this.props.table.tableName}",
              "Key": $input.body
            }`,
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: { "application/json": "" },
              responseParameters: integrationResponseParameters,
            },
            {
              statusCode: "500",
              responseTemplates: { "application/json": "" },
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
          { statusCode: "500" },
        ],
      }
    );
  }
}
