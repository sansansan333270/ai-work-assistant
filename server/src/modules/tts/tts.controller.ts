import { Controller, Post, Body, Get } from '@nestjs/common'
import { TtsService } from './tts.service'

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Get('voices')
  getVoices() {
    const voices = this.ttsService.getVoices()
    return { code: 200, data: voices }
  }

  @Post('synthesize')
  async synthesize(@Body() body: { text: string; speaker?: string; speechRate?: number }) {
    if (!body.text) {
      return { code: 400, msg: '请提供要合成的文本' }
    }

    const result = await this.ttsService.synthesize({
      text: body.text,
      speaker: body.speaker,
      speechRate: body.speechRate,
    })

    if (result.success) {
      return { code: 200, data: { audioUrl: result.audioUrl } }
    } else {
      return { code: 500, msg: result.error || '语音合成失败' }
    }
  }
}
