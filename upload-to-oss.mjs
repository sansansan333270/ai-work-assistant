import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const s3 = new S3Client({
  region: 'cn-beijing',
  endpoint: 'https://tos-s3-cn-beijing.volces.com',
  credentials: {
    accessKeyId: process.env.TOS_ACCESS_KEY || process.env.OSS_ACCESS_KEY,
    secretAccessKey: process.env.TOS_SECRET_KEY || process.env.OSS_SECRET_KEY,
  },
});

async function upload() {
  const file = fs.readFileSync('ai-assistant.tar.gz');
  const key = `ai-assistant-${Date.now()}.tar.gz`;
  
  await s3.send(new PutObjectCommand({
    Bucket: 'coze-coding-project',
    Key: key,
    Body: file,
    ContentType: 'application/gzip',
  }));
  
  console.log(`https://coze-coding-project.tos-cn-beijing.volces.com/${key}`);
}

upload();
