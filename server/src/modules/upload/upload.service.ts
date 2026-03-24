import { Injectable } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'

@Injectable()
export class UploadService {
  private storage: S3Storage

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  // 上传文件
  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    const key = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `uploads/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype,
    })

    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 7, // 7天有效期
    })

    return { key, url }
  }

  // 读取文件内容
  async readFile(key: string): Promise<Buffer> {
    return this.storage.readFile({ fileKey: key })
  }

  // 生成访问URL
  async getFileUrl(key: string): Promise<string> {
    return this.storage.generatePresignedUrl({
      key,
      expireTime: 86400,
    })
  }
}
