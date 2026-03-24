import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class UploadService {
  private uploadDir = path.join(process.cwd(), 'uploads')

  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  // 上传文件到本地存储
  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `uploads/${timestamp}_${safeName}`
    const filePath = path.join(this.uploadDir, `${timestamp}_${safeName}`)

    // 写入文件
    fs.writeFileSync(filePath, file.buffer)

    // 返回相对路径作为 key，URL 用于访问
    const url = `/uploads/${timestamp}_${safeName}`

    return { key, url }
  }

  // 读取文件内容
  async readFile(key: string): Promise<Buffer> {
    // key 格式: uploads/timestamp_filename
    const fileName = key.replace('uploads/', '')
    const filePath = path.join(this.uploadDir, fileName)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`)
    }
    
    return fs.readFileSync(filePath)
  }

  // 生成访问URL
  async getFileUrl(key: string): Promise<string> {
    const fileName = key.replace('uploads/', '')
    return `/uploads/${fileName}`
  }

  // 删除文件
  async deleteFile(key: string): Promise<void> {
    const fileName = key.replace('uploads/', '')
    const filePath = path.join(this.uploadDir, fileName)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  // 检查文件是否存在
  async fileExists(key: string): Promise<boolean> {
    const fileName = key.replace('uploads/', '')
    const filePath = path.join(this.uploadDir, fileName)
    return fs.existsSync(filePath)
  }
}
