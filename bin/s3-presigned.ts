#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3PresignedStack } from '../lib/s3-presigned-stack';

const app = new cdk.App();
new S3PresignedStack(app, 'S3PresignedStack');
