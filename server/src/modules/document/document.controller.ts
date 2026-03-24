import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { DocumentService, DocType } from './document.service'

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('generate')
  async generateDocument(
    @Body() body: { topic: string; type: DocType; details?: string },
  ) {
    const result = await this.documentService.generateDocument({
      topic: body.topic,
      type: body.type || 'free',
      details: body.details,
    })

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }

  @Get('download')
  async downloadDocument(
    @Query('markdown') markdown: string,
    @Query('title') title: string,
    @Res() res: Response,
  ) {
    const wordHtml = this.documentService.markdownToWordHtml(
      decodeURIComponent(markdown),
      decodeURIComponent(title || '文档'),
    )

    res.setHeader('Content-Type', 'application/msword')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(title || '文档')}.doc"`,
    )
    res.send(wordHtml)
  }
}
