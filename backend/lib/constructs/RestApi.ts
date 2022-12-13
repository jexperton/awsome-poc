import { CfnAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { CfnUserPoolClient, UserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface ApiProps {
  loginUrl: string[];
  logoutUrl: string[];
}

export class RestApiConstruct extends Construct {
  props: ApiProps;
  scope: Construct;
  restApi: RestApi;
  authorizer: CfnAuthorizer;
  userPool: UserPool;
  clientApp: CfnUserPoolClient;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);
    this.props = props;
    this.scope = scope;

    this.restApi = new RestApi(this, "Api", {
      minimumCompressionSize: 4096,
      deployOptions: {
        /**
         * Only GET requests are cached by default
         * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html#flush-api-caching:~:text=only%20GET%20methods%20have%20caching%20enabled%20by%20default
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheTtl: Duration.minutes(3),
        */
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // Cognito User Pool with Email Sign-in Type.
    this.userPool = new UserPool(this, "UserPool", {
      signInAliases: {
        email: true,
      },
    });

    this.userPool.addDomain("UserPoolCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "awesome-poc",
      },
    });

    // Authorizer for the Hello World API that uses the
    // Cognito User pool to Authorize users.
    this.authorizer = new CfnAuthorizer(this, "CfnAuth", {
      restApiId: this.restApi.restApiId,
      name: "ApiAuthorizer",
      type: "COGNITO_USER_POOLS",
      identitySource: "method.request.header.Authorization",
      providerArns: [this.userPool.userPoolArn],
    });

    this.clientApp = new CfnUserPoolClient(this, "UserPoolClient", {
      supportedIdentityProviders: ["COGNITO"],
      allowedOAuthFlowsUserPoolClient: true,
      allowedOAuthFlows: ["implicit"],
      allowedOAuthScopes: ["openid"],
      userPoolId: this.userPool.userPoolId,
      callbackUrLs: this.props.loginUrl,
      logoutUrLs: this.props.logoutUrl,

      // the properties below are optional
      /*
      accessTokenValidity: 123,
      authSessionValidity: 123,
      clientName: 'clientName',
      defaultRedirectUri: 'defaultRedirectUri',
      enablePropagateAdditionalUserContextData: false,
      enableTokenRevocation: false,
      explicitAuthFlows: ['explicitAuthFlows'],
      generateSecret: false,
      idTokenValidity: 123,
      preventUserExistenceErrors: 'preventUserExistenceErrors',
      readAttributes: ['readAttributes'],
      refreshTokenValidity: 123,
      supportedIdentityProviders: ['supportedIdentityProviders'],
      tokenValidityUnits: {
        accessToken: 'accessToken',
        idToken: 'idToken',
        refreshToken: 'refreshToken',
      },
      writeAttributes: ['writeAttributes'],
      */
    });
  }
}
