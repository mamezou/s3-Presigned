import { Stack, StackProps, DockerImage, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda_nodejs as NodeLambda,
  aws_lambda as Lambda,
  aws_apigateway as ApiGateway,
  aws_s3 as S3,
  aws_s3_deployment as S3Deployment,
  aws_cloudfront as CloudFront,
  aws_cloudfront_origins as CloudFrontOrigins,
} from 'aws-cdk-lib'
import { spawnSync } from 'child_process';
import * as path from 'path'

export class S3PresignedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dataBucket = new S3.Bucket(this, 'dataBucket', {
      bucketName: `testdatabucket-presigned`,
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
      bucketName: `testspabucket-presigned`,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html'
    })

    const distribution = new CloudFront.Distribution(this, 'distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new CloudFrontOrigins.S3Origin(staticSiteBucket),
      }
    })


    new S3Deployment.BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: staticSiteBucket,
      distribution,
      sources: [
        S3Deployment.Source.asset('./frontend', {
          bundling: {
            image: DockerImage.fromRegistry('node'),
            local: {
              tryBundle: (outputDir) => {
                spawnSync('npm', ['build', outputDir], {
                  stdio: 'inherit'
                })
                return true
              }
            }
          }
        })]
    })

    new CfnOutput(this, 'data-bucket-name', {
      value: dataBucket.bucketName
    })
    new CfnOutput(this, 'spa-bucket-name', {
      value: staticSiteBucket.bucketName
    })

    new CfnOutput(this, 'spa-url', {
      value: staticSiteBucket.bucketWebsiteUrl
    })


  }
}