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

// 辅助模型（用于记忆提取、摘要生成）
const HELPER_MODEL = MODEL_CONFIG.doubao.modelId

interface ChatRequest {
  message: string
  model: string
  mode: 'standard' | 'thinking' | 'fast'
  projectId?: number // 关联的项目ID
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
  category?: string
  embedding: string | null
}

interface ProjectContext {
  project: {
    id: number
    name: string
    type: string
    description: string
    currentProgress: string
    status: string
  }
  settings: Record<string, any>
  outline: Record<string, any>
  writingStyle: Record<string, any>
  recentSummaries: string[]
  projectKnowledge: KnowledgeItem[]
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

    // 构建消息（包含记忆、知识、项目上下文）
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

      // 异步提取记忆（不阻塞响应）- 使用固定模型
      this.extractMemories(request.message, answer, request.projectId).catch(err => {
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

  // 构建消息（支持多模态 + 记忆 + 知识 + 项目上下文）
  private async buildMessages(request: ChatRequest): Promise<Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}>> {
    const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string | any[]}> = []

    // 1. 获取用户记忆
    const memories = await this.getActiveMemories()
    
    // 2. 搜索相关知识（全局知识库）
    const knowledge = await this.searchKnowledge(request.message)

    // 3. 获取项目上下文（如果有 projectId）
    const projectContext = request.projectId ? await this.getProjectContext(request.projectId, request.message) : null

    // 4. 构建系统提示
    let systemPrompt = `你是一个有帮助的AI工作助手。请记住用户的信息和偏好，提供个性化的回答。
回答要求：
1. 简洁明了，重点突出
2. 如果是复杂问题，分点说明
3. 必要时提供示例或建议
4. 保持专业和友好的语气`

    // 添加项目上下文（优先级最高）
    if (projectContext) {
      systemPrompt += this.buildProjectPrompt(projectContext)
    }

    // 添加记忆上下文
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `- ${m.key}: ${m.value}`)
        .join('\n')
      systemPrompt += `\n\n## 用户信息（请记住这些信息）\n${memoryContext}`
    }

    // 添加知识上下文（全局知识库）
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

  // 构建项目上下文提示词
  private buildProjectPrompt(ctx: ProjectContext): string {
    let prompt = `\n\n## 当前项目：${ctx.project.name}`
    
    // 项目类型说明
    const typeNames: Record<string, string> = {
      novel: '小说创作',
      article: '文章写作',
      code: '代码项目',
      other: '其他项目',
    }
    prompt += `（${typeNames[ctx.project.type] || '项目'}）`

    // 项目描述
    if (ctx.project.description) {
      prompt += `\n\n### 项目简介\n${ctx.project.description}`
    }

    // 核心设定
    if (ctx.settings && Object.keys(ctx.settings).length > 0) {
      prompt += `\n\n### 核心设定\n${this.formatSettings(ctx.settings)}`
    }

    // 大纲
    if (ctx.outline && Object.keys(ctx.outline).length > 0) {
      prompt += `\n\n### 项目大纲\n${this.formatOutline(ctx.outline)}`
    }

    // 当前进度
    if (ctx.project.currentProgress) {
      prompt += `\n\n### 当前进度\n${ctx.project.currentProgress}`
    }

    // 写作风格
    if (ctx.writingStyle && Object.keys(ctx.writingStyle).length > 0) {
      prompt += `\n\n### 写作风格要求\n${this.formatWritingStyle(ctx.writingStyle)}`
    }

    // 最近创作摘要
    if (ctx.recentSummaries.length > 0) {
      prompt += `\n\n### 最近创作记录\n${ctx.recentSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    }

    // 项目相关知识
    if (ctx.projectKnowledge.length > 0) {
      prompt += `\n\n### 项目知识库\n${ctx.projectKnowledge
        .map(k => `#### ${k.title}\n${k.content}`)
        .join('\n\n')}`
    }

    return prompt
  }

  // 格式化设定
  private formatSettings(settings: Record<string, any>): string {
    const lines: string[] = []
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'object') {
        lines.push(`**${key}**：${JSON.stringify(value, null, 2)}`)
      } else {
        lines.push(`**${key}**：${value}`)
      }
    }
    return lines.join('\n')
  }

  // 格式化大纲
  private formatOutline(outline: Record<string, any>): string {
    return '```json\n' + JSON.stringify(outline, null, 2) + '\n```'
  }

  // 格式化写作风格
  private formatWritingStyle(style: Record<string, any>): string {
    const lines: string[] = []
    if (style.tone) lines.push(`- 语调：${style.tone}`)
    if (style.perspective) lines.push(`- 视角：${style.perspective}`)
    if (style.referenceSample) lines.push(`- 风格参考：${style.referenceSample}`)
    return lines.join('\n')
  }

  // 获取项目上下文
  private async getProjectContext(projectId: number, query: string): Promise<ProjectContext | null> {
    try {
      // 获取项目信息
      const project = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.id, projectId))
        .limit(1)

      if (project.length === 0) return null

      const p = project[0]

      // 获取最近摘要
      const summaries = await db
        .select({ summary: schema.sessionSummaries.summary })
        .from(schema.sessionSummaries)
        .where(eq(schema.sessionSummaries.projectId, projectId))
        .orderBy(desc(schema.sessionSummaries.createdAt))
        .limit(5)

      // 搜索项目知识库
      const projectKnowledge = await this.searchProjectKnowledge(projectId, query)

      return {
        project: {
          id: p.id,
          name: p.name,
          type: p.type,
          description: p.description || '',
          currentProgress: p.currentProgress || '',
          status: p.status,
        },
        settings: p.settings ? JSON.parse(p.settings) : {},
        outline: p.outline ? JSON.parse(p.outline) : {},
        writingStyle: p.writingStyle ? JSON.parse(p.writingStyle) : {},
        recentSummaries: summaries.map(s => s.summary),
        projectKnowledge,
      }
    } catch (error) {
      console.error('Failed to get project context:', error)
      return null
    }
  }

  // 搜索项目知识库
  private async searchProjectKnowledge(projectId: number, query: string): Promise<KnowledgeItem[]> {
    try {
      // 获取项目关联的知识条目
      const items = await db
        .select()
        .from(schema.knowledgeItems)
        .where(eq(schema.knowledgeItems.projectId, projectId))
        .limit(50)

      if (items.length === 0) return []

      // 生成查询向量
      const queryEmbedding = await this.embeddingClient.embedText(query)

      // 计算相似度并排序
      const itemsWithScore = items
        .filter(item => item.embedding)
        .map(item => {
          const itemEmbedding = JSON.parse(item.embedding as string)
          const score = this.cosineSimilarity(queryEmbedding, itemEmbedding)
          return { ...item, score }
        })
        .filter(item => item.score > 0.4) // 项目知识库阈值稍低
        .sort((a, b) => (b as any).score - (a as any).score)
        .slice(0, 5)

      return itemsWithScore
    } catch (error) {
      console.error('Project knowledge search error:', error)
      return []
    }
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
      // 获取所有有向量的知识条目（非项目关联的）
      const items = await db
        .select()
        .from(schema.knowledgeItems)
        .where(and(
          eq(schema.knowledgeItems.userId, 'default-user'),
          eq(schema.knowledgeItems.projectId, null as any)
        ))
        .limit(100)

      if (items.length === 0) return []

      // 生成查询向量
      const queryEmbedding = await this.embeddingClient.embedText(query)

      // 计算相似度并排序
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

  // 自动提取记忆（增强版：区分项目记忆和全局记忆）
  private async extractMemories(userMessage: string, aiResponse: string, projectId?: number): Promise<void> {
    try {
      // 使用 LLM 分析对话，提取可能的记忆
      const extractPrompt = `分析以下对话，判断是否包含值得长期记忆的用户信息。

【值得记忆】
- 用户的身份信息（姓名、职业、公司、职位）
- 明确表达的偏好（喜欢/不喜欢什么风格）
- 工作相关的习惯（每天几点开会、常用工具）
- 明确的指令（"以后用中文回答"、"不要用markdown"）

【不值得记忆】
- 临时性、一次性的问题（"今天天气"）
- 随意的闲聊内容
- 已经说过的重复信息
- 模糊不明确的表达

对话：
用户：${userMessage}
助手：${aiResponse}

返回格式：
{
  "shouldRemember": true/false,
  "reason": "判断理由",
  "memories": [
    { "type": "preference", "key": "回答语言", "value": "中文", "importance": 7, "isProjectSpecific": false }
  ]
}

isProjectSpecific: 如果是项目相关的记忆（如小说设定偏好），设为 true；如果是通用偏好，设为 false。
只有 shouldRemember 为 true 时才返回 memories 数组。
只返回 JSON，不要其他内容。`

      const stream = this.client.stream([
        { role: 'system', content: '你是一个信息提取助手，从对话中提取用户的重要信息。' },
        { role: 'user', content: extractPrompt }
      ], {
        model: HELPER_MODEL, // 使用固定模型
        temperature: 0.1,
      })

      let result = ''
      for await (const chunk of stream) {
        if (chunk.content) {
          result += chunk.content.toString()
        }
      }

      // 解析结果
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return

      const extracted = JSON.parse(jsonMatch[0])
      
      if (!extracted.shouldRemember || !extracted.memories) return

      // 保存记忆
      for (const memory of extracted.memories) {
        if (memory.key && memory.value) {
          await this.saveMemory(memory, projectId)
        }
      }

      console.log(`Extracted ${extracted.memories.length} memories: ${extracted.reason}`)
    } catch (error) {
      console.error('Memory extraction failed:', error)
    }
  }

  // 保存记忆（更新或创建）
  private async saveMemory(memory: { type: string; key: string; value: string; importance: number }, projectId?: number): Promise<void> {
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

      // 如果是项目特定记忆，也保存到项目知识库
      // TODO: 可以在这里添加项目知识库保存逻辑
    } catch (error) {
      console.error('Failed to save memory:', error)
    }
  }

  // 生成会话摘要
  async generateSessionSummary(messages: Array<{ from: string; content: string }>): Promise<{ summary: string; keyEvents: string[] }> {
    try {
      const conversationText = messages
        .map(m => `${m.from === 'user' ? '用户' : '助手'}：${m.content}`)
        .join('\n')

      const prompt = `请为以下对话生成简洁的摘要，并提取关键事件。

对话内容：
${conversationText}

返回格式：
{
  "summary": "一两句话概括本次对话的主要内容",
  "keyEvents": ["关键事件1", "关键事件2"]
}

只返回 JSON，不要其他内容。`

      const stream = this.client.stream([
        { role: 'system', content: '你是一个对话摘要助手，擅长提取对话要点。' },
        { role: 'user', content: prompt }
      ], {
        model: HELPER_MODEL,
        temperature: 0.1,
      })

      let result = ''
      for await (const chunk of stream) {
        if (chunk.content) {
          result += chunk.content.toString()
        }
      }

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { summary: '对话摘要生成失败', keyEvents: [] }
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Summary generation failed:', error)
      return { summary: '对话摘要生成失败', keyEvents: [] }
    }
  }

  // 检测是否需要创建项目
  async detectProjectIntent(message: string): Promise<{ shouldCreate: boolean; suggestion: string }> {
    try {
      const prompt = `判断用户的消息是否表明想要开始一个长期的任务或创作项目。

用户消息：${message}

【需要创建项目的情况】
- 想写小说、故事、文章
- 想开始一个系列创作
- 想做一个需要多天完成的工作
- 明确提到"项目"、"计划"、"连载"等

【不需要创建项目的情况】
- 简单的问题咨询
- 一次性任务
- 闲聊

返回格式：
{
  "shouldCreate": true/false,
  "projectType": "novel/article/code/other",
  "suggestion": "如果需要创建项目，给用户的建议项目名称"
}

只返回 JSON。`

      const stream = this.client.stream([
        { role: 'system', content: '你是一个意图识别助手。' },
        { role: 'user', content: prompt }
      ], {
        model: HELPER_MODEL,
        temperature: 0.1,
      })

      let result = ''
      for await (const chunk of stream) {
        if (chunk.content) {
          result += chunk.content.toString()
        }
      }

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { shouldCreate: false, suggestion: '' }
      }

      const parsed = JSON.parse(jsonMatch[0])
      return {
        shouldCreate: parsed.shouldCreate,
        suggestion: parsed.suggestion || '',
      }
    } catch (error) {
      console.error('Intent detection failed:', error)
      return { shouldCreate: false, suggestion: '' }
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
