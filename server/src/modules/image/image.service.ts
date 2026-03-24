import { Injectable } from '@nestjs/common'

interface GenerateImageRequest {
  prompt: string
  size: '1K' | '2K' | '4K'
}

export interface GenerateImageResponse {
  id: string
  url: string
  status: string
  progress: number
}

// 模型映射
const MODEL_MAP = {
  '1K': { model: 'nano-banana-pro', imageSize: '1K' },
  '2K': { model: 'nano-banana-pro-4k-vip', imageSize: '2K' },
  '4K': { model: 'nano-banana-pro-4k-vip', imageSize: '4K' },
}

@Injectable()
export class ImageService {
  private readonly apiUrl = 'https://grsai.dakka.com.cn/v1/draw/nano-banana'
  private readonly apiKey = process.env.BANANA_API_KEY || 'sk-c83e754a4d324ef2b784adcc1260d136'

  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const { prompt, size } = request
    const modelConfig = MODEL_MAP[size] || MODEL_MAP['1K']

    console.log('Generating image:', { prompt, size, model: modelConfig.model })

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.model,
          prompt: prompt,
          aspectRatio: 'auto',
          imageSize: modelConfig.imageSize,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Image API error:', errorText)
        throw new Error(`Image generation failed: ${response.status}`)
      }

      // 解析流式响应
      const result = await this.parseStreamResponse(response)
      
      return result
    } catch (error) {
      console.error('Image generation error:', error)
      throw error
    }
  }

  private async parseStreamResponse(response: Response): Promise<GenerateImageResponse> {
    // SSE格式：每行以"data: "开头
    const text = await response.text()
    console.log('Raw response length:', text.length)
    
    // 解析SSE数据
    const lines = text.split('\n')
    let lastData: any = null
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.substring(6).trim()
          if (jsonStr) {
            const json = JSON.parse(jsonStr)
            console.log('SSE data:', JSON.stringify(json).substring(0, 200))
            lastData = json
            
            // 如果生成成功，返回结果
            if (json.status === 'succeeded' && json.results?.length > 0) {
              return {
                id: json.id || '',
                url: json.results[0].url,
                status: 'succeeded',
                progress: 100,
              }
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    // 检查是否还在生成中
    if (lastData) {
      if (lastData.status === 'failed') {
        throw new Error(`Image generation failed: ${lastData.failure_reason || lastData.error || 'Unknown error'}`)
      }
      if (lastData.status === 'running') {
        throw new Error('Image generation timeout - still running')
      }
    }
    
    throw new Error('No image generated')
  }
}
