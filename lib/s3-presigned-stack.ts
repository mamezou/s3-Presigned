import { Stack, StackProps, DockerImage, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda_nodejs as NodeLambda,
  aws_lambda as Lambda,
  aws_apigateway as ApiGateway,
  aws_s3 as S3,
  aws_s3_deployment as S3Deployment,
} from 'aws-cdk-lib'
import { spawnSync } from 'child_process';
import * as path from 'path'

export class S3PresignedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dataBucket = new S3.Bucket(this, 'dataBucket', {
      bucketName: `testdatabucket${new Date().getFullYear()}`,
      blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
    })

    const testFunction = new NodeLambda.NodejsFunction(this, 'testFunction', {
      functionName: 'testFunction',
      entry: path.join(__dirname, '../lambda/index.ts'),
      runtime: Lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
    })

    dataBucket.grantRead(testFunction)

    new ApiGateway.LambdaRestApi(this, 'lambdaTest', {
      handler: testFunction
    })

    const staticSiteBucket = new S3.Bucket(this, 'Bucket', {
      bucketName: `testspabucket${new Date().getFullYear()}`,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html'
    })
    const staticSite = S3Deployment.Source.asset('./frontend', {
      bundling: {
        image: DockerImage.fromRegistry('node'),
        local: {
          tryBundle: (outputDir) => {
            spawnSync('yarn', ['generate', outputDir], {
              stdio: 'inherit'
            })
            return true
          }
        }
      }
    })

    new S3Deployment.BucketDeployment(this, 'BucketDeployment', {
      sources: [staticSite],
      destinationBucket: staticSiteBucket
    })

    new CfnOutput(this, 'dataBucket', {
      value: dataBucket.bucketName
    })
    new CfnOutput(this, 'staticSiteBucket', {
      value: staticSiteBucket.bucketName
    })

  }
}