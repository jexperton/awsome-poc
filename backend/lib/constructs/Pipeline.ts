import { Stack } from "aws-cdk-lib";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  ShellStep,
  CodePipelineSource,
  CodePipeline,
} from "aws-cdk-lib/pipelines";
import { ServicePrincipals } from "cdk-constants";
import { Construct } from "constructs";

import { Env } from "../RootStack";

interface PipelineProps {
  repository: IRepository;
  branch: string;
}

export class PipelineConstruct extends Construct {
  props: PipelineProps;
  scope: Construct;

  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);
    this.props = props;
    this.scope = scope;

    const serviceRole = new Role(this, "Role", {
      assumedBy: new ServicePrincipal(ServicePrincipals.CODE_PIPELINE),
    });

    this.props.repository.grantRead(serviceRole);

    new CodePipeline(this, "Pipeline", {
      pipelineName: "BackendPipeline",
      role: serviceRole,
      synth: new ShellStep("Synth", {
        commands: ["npm ci", `npm run cdk synth`],
        env: {
          [Env.LOGIN_URL]: process.env.LOGIN_URL!,
          [Env.REPOSITORY]: process.env.REPOSITORY!,
        },
        input: CodePipelineSource.codeCommit(
          this.props.repository,
          this.props.branch
        ),
      }),
      synthCodeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            actions: ["ssm:*"],
            resources: [
              `arn:aws:ssm:${Stack.of(this).region}:${
                Stack.of(this).account
              }:parameter/sst/*`,
            ],
          }),
        ],
      },
    });
  }
}
