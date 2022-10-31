import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import {
  AuthorizationType,
  AwsIntegration,
  CfnAuthorizer,
  IRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import {
  integrationResponseParameters,
  methodResponseParameters,
} from "./utils/corsOptions";

interface ListProps {
  table: ITable;
}

export class ListConstruct extends Construct {
  props: ListProps;
  scope: Construct;

  constructor(scope: Construct, id: string, props: ListProps) {
    super(scope, id);
    this.props = props;
    this.scope = scope;
  }

  integrateTo(
    restApi: IRestApi,
    method: "GET",
    path: string,
    authorizer: CfnAuthorizer
  ) {
    const integrationRole = new Role(this, "Role", {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.props.table.grantReadData(integrationRole);

    restApi.root.addResource(path).addMethod(
      method,
      new AwsIntegration({
        service: "dynamodb",
        action: "Scan",
        options: {
          credentialsRole: integrationRole,
          requestParameters: {
            "integration.request.header.Content-Type": "'application/json'",
          },
          requestTemplates: {
            "application/json": `{
              "TableName": "${this.props.table.tableName}"
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
        authorizationType: AuthorizationType.COGNITO,
        authorizer: {
          authorizerId: authorizer.ref,
        },
      }
    );
  }
}
