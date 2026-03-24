// AI模型配置 - 使用 coze-coding-dev-sdk 支持的模型

export interface AIModel {
  id: string
  name: string
  provider: string
  modelId: string  // SDK使用的model ID
  maxTokens: number
  supportsThinking: boolean
  pricing: 'free' | 'paid'
  description: string
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: '深度求索',
    modelId: 'deepseek-v3-2-251201',
    maxTokens: 64000,
    supportsThinking: true,
    pricing: 'free',
    description: '支持深度思考推理，性价比高'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    provider: 'Moonshot',
    modelId: 'kimi-k2-250905',
    maxTokens: 128000,
    supportsThinking: false,
    pricing: 'free',
    description: '支持长文本处理'
  },
  {
    id: 'doubao',
    name: '豆包',
    provider: '字节跳动',
    modelId: 'doubao-seed-1-8-251228',
    maxTokens: 32000,
    supportsThinking: true,
    pricing: 'free',
    description: '字节跳动大模型，多模态支持'
  }
]

// 默认模型
export const DEFAULT_MODEL = AI_MODELS.find(m => m.id === 'deepseek')!
