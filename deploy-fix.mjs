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

// 存储所有上传的文件 key
const uploadedFiles = {};

async function uploadDir(dir, prefix) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDir(filePath, `${prefix}${file}/`);
    } else {
      const content = readFileSync(filePath);
      const fileName = `${prefix}${file}`;
      
      let contentType = "application/octet-stream";
      if (file.endsWith(".html")) contentType = "text/html";
      else if (file.endsWith(".css")) contentType = "text/css";
      else if (file.endsWith(".js")) contentType = "application/javascript";
      
      // 使用返回的实际 key
      const actualKey = await storage.uploadFile({
        fileContent: content,
        fileName: fileName,
        contentType,
      });
      
      // 记录原始文件名和实际 key 的对应关系
      uploadedFiles[fileName] = actualKey;
      console.log("✓", fileName, "->", actualKey);
    }
  }
}

console.log("开始上传...\n");
await uploadDir("dist-web", "ai-app/");

// 找到 index.html 的实际 key
const indexKey = uploadedFiles["ai-app/index.html"];
console.log("\nindex.html 实际 key:", indexKey);

// 生成访问链接
const indexUrl = await storage.generatePresignedUrl({
  key: indexKey,
  expireTime: 86400 * 30,
});

console.log("\n✅ 部署完成！");
console.log("\n📱 访问地址:");
console.log(indexUrl);
