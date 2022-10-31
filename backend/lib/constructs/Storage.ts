import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

import {
  AllowedMethods,
  Distribution,
  OriginAccessIdentity,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { CanonicalUserPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Duration } from "aws-cdk-lib";

export class StorageConstruct extends Construct {
  destinationBucket: Bucket;
  transcriptionDist: Distribution;
  sourceBucket: Bucket;
  audioDist: Distribution;
  appBucket: Bucket;
  appDist: Distribution;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cloudFrontOAI = new OriginAccessIdentity(scope, "OAI");

    // the S3 bucket where audio files are stored
    this.sourceBucket = new Bucket(scope, "source-audio-files", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    this.sourceBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.sourceBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    this.audioDist = new Distribution(scope, "AudioDistribution", {
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new S3Origin(this.sourceBucket),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // the S3 bucket where audio transcriptions are stored
    this.destinationBucket = new Bucket(scope, "transcription-files", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    this.destinationBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.destinationBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    this.transcriptionDist = new Distribution(
      scope,
      "TranscriptionDistribution",
      {
        minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        defaultBehavior: {
          origin: new S3Origin(this.destinationBucket),
          compress: true,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    // React app bucket
    this.appBucket = new Bucket(scope, "app-files", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    this.appBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.appBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // CloudFront distribution
    this.appDist = new Distribution(scope, "Distribution", {
      defaultRootObject: "index.html",
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: "/error.html",
          ttl: Duration.minutes(1),
        },
      ],
      defaultBehavior: {
        origin: new S3Origin(this.appBucket),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
  }
}
