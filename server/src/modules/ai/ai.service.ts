import { Injectable } from '@nestjs/common'

interface AIModel {
  id: string
  name: string
  provider: string
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  supportsThinking: boolean
}

const AI_MODELS: Record<string, AIModel> = {
  doubao: {
    id: 'doubao',
    name: '豆包',
    provider: '字节跳动',
    apiKey: process.env.DOUBAO_API_KEY || '',
    baseUrl: 'https://api.doubao.com/v1',
    model: 'doubao-pro-32k',
    maxTokens: 32000,
    supportsThinking: false
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    provider: 'Moonshot',
    apiKey: process.env.KIMI_API_KEY || '',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    maxTokens: 8000,
    supportsThinking: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: '深度求索',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxTokens: 64000,
    supportsThinking: true
  },
  gpt4: {
    id: 'gpt4',
    name: 'ChatGPT-4',
    provider: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo',
    maxTokens: 128000,
    supportsThinking: false
  }
}

interface ChatRequest {
  message: string
  model: string
  mode: 'standard' | 'thinking' | 'fast'
  context?: Array<{ type: string; content: string; from: string }>
}

@Injectable()
export class AiService {
  async chat(request: ChatRequest) {
    const modelConfig = AI_MODELS[request.model]
    
    if (!modelConfig) {
      throw new Error(`Model ${request.model} not found`)
    }

    // 如果没有配置API密钥，使用Demo模式
    if (!modelConfig.apiKey) {
      console.log(`API key not configured for model ${request.model}, using demo mode`)
      return {
        answer: this.getDemoResponse(request.message),
        thinking: null,
        isDemo: true
      }
    }

    // 构建消息历史
    const messages = this.buildMessages(request)

    // 根据模式调用不同的API
    if (request.mode === 'thinking' && modelConfig.supportsThinking) {
      return await this.chatWithThinking(modelConfig, messages)
    } else {
      return await this.chatStandard(modelConfig, messages)
    }
  }

  // 标准对话
  private async chatStandard(modelConfig: AIModel, messages: Array<{role: string; content: string}>) {
    try {
      const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        answer: data.choices[0].message.content,
        thinking: null
      }
    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  }

  // 深度思考模式
  private async chatWithThinking(modelConfig: AIModel, messages: Array<{role: string; content: string}>) {
    // 对于DeepSeek，使用特殊的思考提示
    const thinkingPrompt = {
      role: 'system',
      content: `请在回答前，先用<thinking>标签展示你的思考过程，然后再给出最终答案。
                
格式示例：
<thinking>
让我仔细分析这个问题...
首先...然后...最后...
</thinking>

最终答案：...`
    }

    try {
      const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [thinkingPrompt, ...messages],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // 提取思考过程和最终答案
      const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/)
      const thinking = thinkingMatch ? thinkingMatch[1].trim() : null
      const answer = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()

      return {
        answer,
        thinking
      }
    } catch (error) {
      console.error('Chat with thinking API error:', error)
      throw error
    }
  }

  // Demo模式：模拟AI响应
  private getDemoResponse(message: string) {
    const responses = [
      `这是一个演示回复。您提到的是："${message}"。\n\n要使用真实的AI功能，请按照 AI_CONFIG.md 文档配置API密钥。\n\n推荐使用 DeepSeek，性价比最高！`,
      `收到您的消息："${message}"。\n\n这是Demo模式，功能有限。配置API密钥后可体验完整AI功能。`,
      `您好！我注意到您还没有配置API密钥。\n\n当前运行在Demo模式下。请查看项目根目录的 AI_CONFIG.md 文件，按照指南配置API密钥即可使用完整功能。\n\n推荐先配置 DeepSeek，新用户有免费额度！`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 构建消息历史
  private buildMessages(request: ChatRequest) {
    const messages: Array<{role: string; content: string}> = []

    // 添加系统提示
    messages.push({
      role: 'system',
      content: '你是一个有帮助的AI助手，请记住用户的信息和偏好，提供个性化的回答。'
    })

    // 添加上下文
    if (request.context && request.context.length > 0) {
      request.context.forEach(msg => {
        messages.push({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }

    // 添加当前消息
    messages.push({
      role: 'user',
      content: request.message
    })

    return messages
  }

  // 生图接口
  async generateImage(prompt: string, options?: any) {
    const imageApiUrl = process.env.IMAGE_API_URL
    const imageApiKey = process.env.IMAGE_API_KEY

    if (!imageApiUrl || !imageApiKey) {
      throw new Error('Image API not configured')
    }

    try {
      const response = await fetch(imageApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${imageApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          size: options?.size || '1024x1024',
          style: options?.style || 'default'
        })
      })

      if (!response.ok) {
        throw new Error(`Image API request failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Image generation error:', error)
      throw error
    }
  }
}
