import { Injectable } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'
import { UploadService } from '../upload/upload.service'

// 模型配置映射
const MODEL_CONFIG: Record<string, { modelId: string; supportsThinking: boolean; supportsVision: boolean }> = {
  deepseek: {
    modelId: 'deepseek-v3-2-251201',
    supportsThinking: true,
    supportsVision: false,
  },
  kimi: {
    modelId: 'kimi-k2-250905',
    supportsThinking: false,
    supportsVision: false,
  },
  doubao: {
    modelId: 'doubao-seed-1-8-251228',
    supportsThinking: true,
    supportsVision: true,
  },
}

// 视觉模型（专门用于图片分析）
const VISION_MODEL_ID = 'doubao-seed-1-6-vision-250815'

interface ChatRequest {
  message: string
  model: string
  mode: 'standard' | 'thinking' | 'fast'
  context?: Array<{ type: string; content: string; from: string }>
  fileKey?: string // 上传的文件key
  fileUrl?: string // 文件访问URL
  fileType?: string // 文件类型（image/text等）
}

@Injectable()
export class AiService {
  private client: LLMClient
  private config: Config

  constructor(private readonly uploadService: UploadService) {
    this.config = new Config()
    this.client = new LLMClient(this.config)
  }

  async chat(request: ChatRequest) {
    const modelConfig = MODEL_CONFIG[request.model]
    
    if (!modelConfig) {
      throw new Error(`Model ${request.model} not supported`)
    }

    // 构建消息
    const messages = await this.buildMessages(request)

    // 确定是否启用思考模式
    const enableThinking = request.mode === 'thinking' && modelConfig.supportsThinking

    // 如果有图片，使用视觉模型
    const useVisionModel = request.fileType === 'image' && request.fileUrl

    try {
      const stream = this.client.stream(messages, {
        model: useVisionModel ? VISION_MODEL_ID : modelConfig.modelId,
        thinking: enableThinking ? 'enabled' : 'disabled',
        temperature: request.mode === 'fast' ? 0.3 : 0.7,
      })

      let fullContent = ''
      let thinkingContent = ''
      let isInThinking = false

      for await (const chunk of stream) {
        if (chunk.content) {
          const text = chunk.content.toString()
          fullContent += text
          
          if (text.includes('<thinking>')) {
            isInThinking = true
          }
          if (isInThinking) {
            thinkingContent += text
          }
          if (text.includes('</thinking>')) {
            isInThinking = false
          }
        }
      }

      let answer = fullContent
      if (thinkingContent) {
        const thinkingMatch = fullContent.match(/<thinking>([\s\S]*?)<\/thinking>/)
        if (thinkingMatch) {
          thinkingContent = thinkingMatch[1].trim()
          answer = fullContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
        }
      }

      return {
        answer,
        thinking: thinkingContent || null,
      }
    } catch (error) {
      console.error('LLM API error:', error)
      throw error
    }
  }

  // 构建消息（支持多模态）
  private async buildMessages(request: ChatRequest): Promise<Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}>> {
    const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}> = []

    // 系统提示
    messages.push({
      role: 'system',
      content: `你是一个有帮助的AI工作助手。请记住用户的信息和偏好，提供个性化的回答。
回答要求：
1. 简洁明了，重点突出
2. 如果是复杂问题，分点说明
3. 必要时提供示例或建议
4. 保持专业和友好的语气`,
    })

    // 添加上下文
    if (request.context && request.context.length > 0) {
      request.context.forEach(msg => {
        messages.push({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      })
    }

    // 处理当前消息
    if (request.fileType === 'image' && request.fileUrl) {
      // 图片分析：使用多模态格式
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: request.message || '请分析这张图片' },
          {
            type: 'image_url',
            image_url: {
              url: request.fileUrl,
              detail: 'high',
            },
          },
        ],
      })
    } else if (request.fileKey && request.fileType === 'text') {
      // 文本文件：读取内容并添加到消息
      try {
        const buffer = await this.uploadService.readFile(request.fileKey)
        const fileContent = buffer.toString('utf-8')
        messages.push({
          role: 'user',
          content: `${request.message}\n\n文件内容：\n\`\`\`\n${fileContent}\n\`\`\``,
        })
      } catch (error) {
        console.error('Failed to read file:', error)
        messages.push({
          role: 'user',
          content: `${request.message}\n\n[文件读取失败]`,
        })
      }
    } else {
      // 普通文本消息
      messages.push({
        role: 'user',
        content: request.message,
      })
    }

    return messages
  }
}
