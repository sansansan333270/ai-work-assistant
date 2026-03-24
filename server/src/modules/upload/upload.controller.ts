import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Query } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传文件
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadFile(file)
    
    return {
      success: true,
      data: {
        key: result.key,
        url: result.url,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    }
  }

  // 获取文件URL
  @Get('url')
  async getFileUrl(@Query('key') key: string) {
    const url = await this.uploadService.getFileUrl(key)
    return { url }
  }
}
