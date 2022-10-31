import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { IRestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import { Env } from "../RootStack";
import {
  integrationResponseParameters,
  methodResponseParameters,
} from "./utils/corsOptions";

interface SearchProps {
  openSearch: IDomain;
  index: string;
}

export class SearchConstruct extends Construct {
  nodeJsConfig: { runtime: Runtime; memorySize: number; timeout: Duration };
  props: SearchProps;
  scope: Construct;
  search: NodejsFunction;

  constructor(scope: Construct, id: string, props: SearchProps) {
    super(scope, id);

    this.nodeJsConfig = {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(30),
    };
    this.props = props;
    this.scope = scope;
    this.search = this.searchHandler();
  }

  integrateTo(restApi: IRestApi, method: "GET", path: string) {
    const integrationRole = new Role(this, "SearchRole", {
      assumedBy: new ServicePrincipal(ServicePrincipals.API_GATEWAY),
    });

    this.search.grantInvoke(integrationRole);

    restApi.root.addResource(path).addMethod(
      method,
      new LambdaIntegration(this.search, {
        proxy: false,
        cacheNamespace: "search",
        cacheKeyParameters: ["method.request.querystring.terms"],
        credentialsRole: integrationRole,
        requestParameters: {
          "integration.request.header.Content-Type": "'application/json'",
          "integration.request.querystring.terms":
            "method.request.querystring.terms",
        },
        requestTemplates: {
          "application/json": `{"terms": "$input.params('terms')"}`,
        },
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
        requestParameters: {
          "method.request.querystring.terms": true,
        },
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
  private searchHandler(functionName = "search") {
    const serviceRole = new Role(this.scope, `${functionName}Role`, {
      assumedBy: new ServicePrincipal(ServicePrincipals.LAMBDA),
      inlinePolicies: {
        main: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["aoss:*"],
              resources: [`${this.props.openSearch.domainArn}/*`],
            }),
          ],
        }),
      },
    });

    return new NodejsFunction(this.scope, functionName, {
      ...this.nodeJsConfig,
      role: serviceRole,
      environment: {
        [Env.OPENSEARCH_ENDPOINT]: this.props.openSearch.domainEndpoint,
        [Env.SEARCH_INDEX]: this.props.index,
      },
    });
  }
}
