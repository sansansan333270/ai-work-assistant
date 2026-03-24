import { Injectable } from '@nestjs/common'
import { LLMClient, ASRClient, EmbeddingClient, Config } from 'coze-coding-dev-sdk'
import { UploadService } from '../upload/upload.service'
import { db, schema } from '@/database'
import { eq, and, desc } from 'drizzle-orm'

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

interface Memory {
  id: number
  type: string
  key: string
  value: string
  importance: number | null
}

interface KnowledgeItem {
  id: number
  title: string
  content: string
  embedding: string | null
}

@Injectable()
export class AiService {
  private client: LLMClient
  private asrClient: ASRClient
  private embeddingClient: EmbeddingClient
  private config: Config

  constructor(private readonly uploadService: UploadService) {
    this.config = new Config()
    this.client = new LLMClient(this.config)
    this.asrClient = new ASRClient(this.config)
    this.embeddingClient = new EmbeddingClient(this.config)
  }

  async chat(request: ChatRequest) {
    const modelConfig = MODEL_CONFIG[request.model]
    
    if (!modelConfig) {
      throw new Error(`Model ${request.model} not supported`)
    }

    // 构建消息（包含记忆和知识）
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

      // 异步提取记忆（不阻塞响应）
      this.extractMemories(request.message, answer).catch(err => {
        console.error('Memory extraction error:', err)
      })

      return {
        answer,
        thinking: thinkingContent || null,
      }
    } catch (error) {
      console.error('LLM API error:', error)
      throw error
    }
  }

  // 构建消息（支持多模态 + 记忆 + 知识）
  private async buildMessages(request: ChatRequest): Promise<Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}>> {
    const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}> = []

    // 1. 获取用户记忆
    const memories = await this.getActiveMemories()
    
    // 2. 搜索相关知识
    const knowledge = await this.searchKnowledge(request.message)

    // 3. 构建系统提示
    let systemPrompt = `你是一个有帮助的AI工作助手。请记住用户的信息和偏好，提供个性化的回答。
回答要求：
1. 简洁明了，重点突出
2. 如果是复杂问题，分点说明
3. 必要时提供示例或建议
4. 保持专业和友好的语气`

    // 添加记忆上下文
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `- ${m.key}: ${m.value}`)
        .join('\n')
      systemPrompt += `\n\n## 用户信息（请记住这些信息）\n${memoryContext}`
    }

    // 添加知识上下文
    if (knowledge.length > 0) {
      const knowledgeContext = knowledge
        .map(k => `### ${k.title}\n${k.content}`)
        .join('\n\n')
      systemPrompt += `\n\n## 相关知识库\n${knowledgeContext}`
    }

    messages.push({
      role: 'system',
      content: systemPrompt,
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

  // 获取激活的记忆
  private async getActiveMemories(): Promise<Memory[]> {
    try {
      const memories = await db
        .select()
        .from(schema.memories)
        .where(and(
          eq(schema.memories.userId, 'default-user'),
          eq(schema.memories.isActive, true)
        ))
        .orderBy(desc(schema.memories.importance))
        .limit(20)
      
      return memories
    } catch (error) {
      console.error('Failed to get memories:', error)
      return []
    }
  }

  // 搜索相关知识（向量搜索）
  private async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
    try {
      // 1. 获取所有有向量的知识条目
      const items = await db
        .select()
        .from(schema.knowledgeItems)
        .where(eq(schema.knowledgeItems.userId, 'default-user'))
        .limit(100)

      if (items.length === 0) {
        return []
      }

      // 2. 生成查询向量
      const queryEmbedding = await this.embeddingClient.embedText(query)

      // 3. 计算相似度并排序
      const itemsWithScore = items
        .filter(item => item.embedding)
        .map(item => {
          const itemEmbedding = JSON.parse(item.embedding as string)
          const score = this.cosineSimilarity(queryEmbedding, itemEmbedding)
          return { ...item, score }
        })
        .filter(item => item.score > 0.5) // 相似度阈值
        .sort((a, b) => (b as any).score - (a as any).score)
        .slice(0, 5) // 返回 top 5

      return itemsWithScore
    } catch (error) {
      console.error('Knowledge search error:', error)
      return []
    }
  }

  // 余弦相似度计算
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // 自动提取记忆
  private async extractMemories(userMessage: string, aiResponse: string): Promise<void> {
    try {
      // 使用 LLM 分析对话，提取可能的记忆
      const extractPrompt = `分析以下对话，提取用户的重要信息（如姓名、职业、偏好、习惯等）。
对话：
用户：${userMessage}
助手：${aiResponse}

请以 JSON 数组格式返回提取的记忆，每条记忆包含：
- type: 类型（preference/fact/context/instruction）
- key: 键名（如"用户姓名"、"工作领域"、"回答偏好"）
- value: 值
- importance: 重要程度（1-10）

如果没有可提取的信息，返回空数组 []
只返回 JSON，不要其他内容。`

      const stream = this.client.stream([
        { role: 'system', content: '你是一个信息提取助手，从对话中提取用户的重要信息。' },
        { role: 'user', content: extractPrompt }
      ], {
        model: MODEL_CONFIG.doubao.modelId,
        temperature: 0.1,
      })

      let result = ''
      for await (const chunk of stream) {
        if (chunk.content) {
          result += chunk.content.toString()
        }
      }

      // 解析提取的记忆
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return

      const memories = JSON.parse(jsonMatch[0])
      
      // 保存记忆
      for (const memory of memories) {
        if (memory.key && memory.value) {
          await this.saveMemory(memory)
        }
      }

      console.log(`Extracted ${memories.length} memories from conversation`)
    } catch (error) {
      console.error('Memory extraction failed:', error)
    }
  }

  // 保存记忆（更新或创建）
  private async saveMemory(memory: { type: string; key: string; value: string; importance: number }): Promise<void> {
    try {
      // 检查是否已存在相同 key 的记忆
      const existing = await db
        .select()
        .from(schema.memories)
        .where(and(
          eq(schema.memories.userId, 'default-user'),
          eq(schema.memories.key, memory.key)
        ))
        .limit(1)

      if (existing.length > 0) {
        // 更新现有记忆
        await db
          .update(schema.memories)
          .set({
            value: memory.value,
            importance: memory.importance,
            updatedAt: new Date(),
          })
          .where(eq(schema.memories.id, existing[0].id))
        
        console.log(`Updated memory: ${memory.key}`)
      } else {
        // 创建新记忆
        await db.insert(schema.memories).values({
          userId: 'default-user',
          type: memory.type || 'fact',
          key: memory.key,
          value: memory.value,
          importance: memory.importance || 5,
          isActive: true,
        })
        
        console.log(`Created memory: ${memory.key}`)
      }
    } catch (error) {
      console.error('Failed to save memory:', error)
    }
  }

  // 语音识别
  async asr(audioUrl: string): Promise<{ text: string }> {
    try {
      const result = await this.asrClient.recognize({
        uid: 'default-user',
        url: audioUrl,
      })
      
      console.log('ASR result:', { text: result.text, duration: result.duration })
      
      return {
        text: result.text,
      }
    } catch (error) {
      console.error('ASR error:', error)
      throw error
    }
  }

  // 为笔记生成向量（供外部调用）
  async embedText(text: string): Promise<number[]> {
    return this.embeddingClient.embedText(text)
  }
}
