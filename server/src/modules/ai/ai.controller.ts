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
      messageLength: body.message?.length
    })

    try {
      const result = await this.aiService.chat({
        message: body.message,
        model: body.model,
        mode: body.mode,
        context: body.context
      })

      console.log('Chat response:', {
        answerLength: result.answer?.length,
        hasThinking: !!result.thinking
      })

      return {
        answer: result.answer,
        thinking: result.thinking
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
      size: body.size
    })

    try {
      const result = await this.aiService.generateImage(body.prompt, body.options)
      console.log('Image generated:', result.imageUrl || result.url)
      return result
    } catch (error) {
      console.error('Image generation error:', error)
      throw error
    }
  }
}
