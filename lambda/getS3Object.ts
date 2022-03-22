import { S3 } from "aws-sdk";
import { Body } from "aws-sdk/clients/s3";
const s3 = new S3();

export const getS3Object = async (Bucket: string, Key: string): Promise<S3.Body | [S3.Body, number] | undefined> => {
  const params = {
    Bucket,
    Key,
  };
  let res: S3.GetObjectOutput = {};
  try {
    res = await s3.getObject(params).promise();
  } catch (e) {
    console.log(e);
  }

  return res.Body;
}
