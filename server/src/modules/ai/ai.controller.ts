import { Controller, Post, Body } from '@nestjs/common'
import { AiService } from './ai.service'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: any) {
    console.log('Chat request:', {
      model: body.model,
      mode: body.mode,
      messageLength: body.message?.length,
      hasFile: !!body.fileKey,
      fileType: body.fileType,
    })

    try {
      const result = await this.aiService.chat({
        message: body.message,
        model: body.model,
        mode: body.mode,
        context: body.context,
        fileKey: body.fileKey,
        fileUrl: body.fileUrl,
        fileType: body.fileType,
      })

      console.log('Chat response:', {
        answerLength: result.answer?.length,
        hasThinking: !!result.thinking,
      })

      return {
        answer: result.answer,
        thinking: result.thinking,
      }
    } catch (error) {
      console.error('Chat error:', error)
      throw error
    }
  }

  @Post('generate-image')
  async generateImage(@Body() body: any) {
    console.log('Image generation request:', {
      prompt: body.prompt,
      size: body.size,
    })

    return {
      error: 'Image generation requires additional API configuration',
    }
  }
}
