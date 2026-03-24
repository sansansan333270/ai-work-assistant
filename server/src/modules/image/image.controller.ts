import { Controller, Post, Body } from '@nestjs/common'
import { ImageService } from './image.service'

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('generate')
  async generateImage(@Body() body: { prompt: string; size?: '1K' | '2K' | '4K' }) {
    const result = await this.imageService.generateImage({
      prompt: body.prompt,
      size: body.size || '1K',
    })

    return {
      code: 200,
      msg: 'success',
      data: result,
    }
  }
}
