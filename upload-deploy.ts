import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";

async function upload() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const fileContent = fs.readFileSync("deploy-web.tar.gz");
  
  const key = await storage.uploadFile({
    fileContent,
    fileName: "ai-work-assistant/deploy-web.tar.gz",
    contentType: "application/gzip",
  });

  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 86400 * 7, // 7天有效
  });

  console.log("下载链接:", url);
}

upload().catch(console.error);
