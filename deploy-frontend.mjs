import { S3Storage } from "coze-coding-dev-sdk";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function uploadDir(dir, prefix) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDir(filePath, `${prefix}${file}/`);
    } else {
      const content = readFileSync(filePath);
      const key = `${prefix}${file}`;
      
      let contentType = "application/octet-stream";
      if (file.endsWith(".html")) contentType = "text/html";
      else if (file.endsWith(".css")) contentType = "text/css";
      else if (file.endsWith(".js")) contentType = "application/javascript";
      
      await storage.uploadFile({
        fileContent: content,
        fileName: key,
        contentType,
      });
      
      console.log("✓", key);
    }
  }
}

console.log("开始上传前端文件...\n");
await uploadDir("dist-web", "ai-app/");

const indexUrl = await storage.generatePresignedUrl({
  key: "ai-app/index.html",
  expireTime: 86400 * 30,
});

console.log("\n✅ 部署完成！");
console.log("\n📱 访问地址:");
console.log(indexUrl);
