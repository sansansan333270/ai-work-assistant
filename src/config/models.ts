// AI模型配置

export interface AIModel {
  id: string
  name: string
  provider: string
  model: string
  maxTokens: number
  supportsThinking: boolean
  pricing: 'free' | 'paid'
  description: string
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'doubao',
    name: '豆包',
    provider: '字节跳动',
    model: 'doubao-pro-32k',
    maxTokens: 32000,
    supportsThinking: false,
    pricing: 'free',
    description: '字节跳动大模型，支持长文本'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    provider: 'Moonshot',
    model: 'moonshot-v1-8k',
    maxTokens: 8000,
    supportsThinking: false,
    pricing: 'free',
    description: '支持20万字长文本'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: '深度求索',
    model: 'deepseek-chat',
    maxTokens: 64000,
    supportsThinking: true,
    pricing: 'free',
    description: '支持深度思考推理'
  },
  {
    id: 'gpt4',
    name: 'ChatGPT-4',
    provider: 'OpenAI',
    model: 'gpt-4-turbo',
    maxTokens: 128000,
    supportsThinking: false,
    pricing: 'paid',
    description: 'OpenAI最强模型'
  }
]
