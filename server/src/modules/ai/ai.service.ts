import { Injectable } from '@nestjs/common'
import { UploadService } from '../upload/upload.service'
import { db, schema } from '@/database'
import { eq, and, desc, like, or } from 'drizzle-orm'

// 模型配置映射 - 使用各平台原生 API
const MODEL_CONFIG: Record<string, { 
  provider: string
  modelId: string
  supportsThinking: boolean
  supportsVision: boolean
  baseUrl: string
  apiKeyEnv: string
}> = {
  deepseek: {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    supportsThinking: true, // deepseek-reasoner 支持思考
    supportsVision: false,
    baseUrl: 'https://api.deepseek.com',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  kimi: {
    provider: 'kimi',
    modelId: 'moonshot-v1-128k',
    supportsThinking: false,
    supportsVision: false,
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'KIMI_API_KEY',
  },
  doubao: {
    provider: 'doubao',
    modelId: 'ep-20250108231407-wm7fv', // 豆包需要使用 endpoint ID
    supportsThinking: true,
    supportsVision: true,
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyEnv: 'DOUBAO_API_KEY',
  },
}

// 辅助模型配置
const HELPER_MODEL_KEY = 'deepseek' // 用于记忆提取、摘要生成

interface ChatRequest {
  message: string
  model: string
  mode: 'standard' | 'thinking' | 'fast'
  projectId?: number
  context?: Array<{ type: string; content: string; from: string }>
  fileKey?: string
  fileUrl?: string
  fileType?: string
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
  constructor(private readonly uploadService: UploadService) {}

  // 获取 API Key
  private getApiKey(modelKey: string): string {
    const config = MODEL_CONFIG[modelKey]
    if (!config) {
      throw new Error(`Model ${modelKey} not supported`)
    }
    
    const apiKey = process.env[config.apiKeyEnv]
    if (!apiKey) {
      throw new Error(`API key not configured for ${modelKey}. Please set ${config.apiKeyEnv} in environment.`)
    }
    return apiKey
  }

  // 主聊天方法
  async chat(request: ChatRequest) {
    const modelConfig = MODEL_CONFIG[request.model]
    
    if (!modelConfig) {
      throw new Error(`Model ${request.model} not supported`)
    }

    // 构建消息
    const messages = await this.buildMessages(request)

    // 确定是否启用思考模式
    const enableThinking = request.mode === 'thinking' && modelConfig.supportsThinking

    // 根据模型选择调用方式
    if (modelConfig.provider === 'deepseek') {
      return this.callDeepSeek(messages, modelConfig, enableThinking, request.mode)
    } else if (modelConfig.provider === 'kimi') {
      return this.callKimi(messages, modelConfig, request.mode)
    } else if (modelConfig.provider === 'doubao') {
      return this.callDoubao(messages, modelConfig, enableThinking, request.mode)
    }

    throw new Error(`Provider ${modelConfig.provider} not implemented`)
  }

  // 调用 DeepSeek API (OpenAI 兼容格式)
  private async callDeepSeek(
    messages: Array<{role: string; content: string | any[]}>,
    config: typeof MODEL_CONFIG.deepseek,
    enableThinking: boolean,
    mode: string
  ) {
    const apiKey = this.getApiKey('deepseek')
    
    // 如果启用思考模式，使用 deepseek-reasoner
    const model = enableThinking ? 'deepseek-reasoner' : config.modelId
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: mode === 'fast' ? 0.3 : 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeepSeek API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    // DeepSeek reasoner 会在 reasoning_content 中返回思考过程
    const thinking = data.choices[0]?.message?.reasoning_content || null

    // 提取用户消息文本
    const lastUserMessage = messages[messages.length - 1]
    const userText = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content 
      : (lastUserMessage.content as any[]).find(c => c.type === 'text')?.text || ''
    
    // 异步提取记忆 - 使用用户选择的模型
    this.extractMemories(userText, content, 'deepseek').catch(err => {
      console.error('Memory extraction error:', err)
    })

    return {
      answer: content,
      thinking,
    }
  }

  // 调用 Kimi API (OpenAI 兼容格式)
  private async callKimi(
    messages: Array<{role: string; content: string | any[]}>,
    config: typeof MODEL_CONFIG.kimi,
    mode: string
  ) {
    const apiKey = this.getApiKey('kimi')
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages,
        temperature: mode === 'fast' ? 0.3 : 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Kimi API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // 提取用户消息文本
    const lastUserMessage = messages[messages.length - 1]
    const userText = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content 
      : (lastUserMessage.content as any[]).find(c => c.type === 'text')?.text || ''
    
    // 异步提取记忆 - 使用用户选择的模型
    this.extractMemories(userText, content, 'kimi').catch(err => {
      console.error('Memory extraction error:', err)
    })

    return {
      answer: content,
      thinking: null,
    }
  }

  // 调用豆包 API (火山引擎 ARK 格式)
  private async callDoubao(
    messages: Array<{role: string; content: string | any[]}>,
    config: typeof MODEL_CONFIG.doubao,
    enableThinking: boolean,
    mode: string
  ) {
    const apiKey = this.getApiKey('doubao')
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages,
        temperature: mode === 'fast' ? 0.3 : 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Doubao API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    // 豆包思考模式会在特定字段返回
    const thinking = data.choices[0]?.message?.reasoning_content || null

    // 提取用户消息文本
    const lastUserMessage = messages[messages.length - 1]
    const userText = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content 
      : (lastUserMessage.content as any[]).find(c => c.type === 'text')?.text || ''
    
    // 异步提取记忆 - 使用用户选择的模型
    this.extractMemories(userText, content, 'doubao').catch(err => {
      console.error('Memory extraction error:', err)
    })

    return {
      answer: content,
      thinking,
    }
  }

  // 构建消息（支持多模态 + 记忆 + 知识 + 项目上下文）
  private async buildMessages(request: ChatRequest): Promise<Array<{role: string; content: string | any[]}>> {
    const messages: Array<{role: string; content: string | any[]}> = []

    // 1. 获取用户记忆
    const memories = await this.getActiveMemories()
    
    // 2. 搜索相关知识
    const knowledge = await this.searchKnowledge(request.message)

    // 3. 获取项目上下文
    const projectContext = request.projectId ? await this.getProjectContext(request.projectId, request.message) : null

    // 4. 构建系统提示
    let systemPrompt = `你是一个有帮助的AI工作助手。请记住用户的信息和偏好，提供个性化的回答。
回答要求：
1. 简洁明了，重点突出
2. 如果是复杂问题，分点说明
3. 必要时提供示例或建议
4. 保持专业和友好的语气`

    // 添加项目上下文
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
    
    const typeNames: Record<string, string> = {
      novel: '小说创作',
      article: '文章写作',
      code: '代码项目',
      other: '其他项目',
    }
    prompt += `（${typeNames[ctx.project.type] || '项目'}）`

    if (ctx.project.description) {
      prompt += `\n\n### 项目简介\n${ctx.project.description}`
    }

    if (ctx.settings && Object.keys(ctx.settings).length > 0) {
      prompt += `\n\n### 核心设定\n${this.formatSettings(ctx.settings)}`
    }

    if (ctx.outline && Object.keys(ctx.outline).length > 0) {
      prompt += `\n\n### 项目大纲\n${this.formatOutline(ctx.outline)}`
    }

    if (ctx.project.currentProgress) {
      prompt += `\n\n### 当前进度\n${ctx.project.currentProgress}`
    }

    if (ctx.writingStyle && Object.keys(ctx.writingStyle).length > 0) {
      prompt += `\n\n### 写作风格要求\n${this.formatWritingStyle(ctx.writingStyle)}`
    }

    if (ctx.recentSummaries.length > 0) {
      prompt += `\n\n### 最近创作记录\n${ctx.recentSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    }

    if (ctx.projectKnowledge.length > 0) {
      prompt += `\n\n### 项目知识库\n${ctx.projectKnowledge
        .map(k => `#### ${k.title}\n${k.content}`)
        .join('\n\n')}`
    }

    return prompt
  }

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

  private formatOutline(outline: Record<string, any>): string {
    return '```json\n' + JSON.stringify(outline, null, 2) + '\n```'
  }

  private formatWritingStyle(style: Record<string, any>): string {
    const lines: string[] = []
    if (style.tone) lines.push(`- 语调：${style.tone}`)
    if (style.perspective) lines.push(`- 视角：${style.perspective}`)
    if (style.referenceSample) lines.push(`- 风格参考：${style.referenceSample}`)
    return lines.join('\n')
  }

  private async getProjectContext(projectId: number, query: string): Promise<ProjectContext | null> {
    try {
      const project = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.id, projectId))
        .limit(1)

      if (project.length === 0) return null

      const p = project[0]

      const summaries = await db
        .select({ summary: schema.sessionSummaries.summary })
        .from(schema.sessionSummaries)
        .where(eq(schema.sessionSummaries.projectId, projectId))
        .orderBy(desc(schema.sessionSummaries.createdAt))
        .limit(5)

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

  private async searchProjectKnowledge(projectId: number, query: string): Promise<KnowledgeItem[]> {
    try {
      // 使用关键词搜索替代向量搜索
      const keywords = query.split(/\s+/).filter(k => k.length > 1).slice(0, 5)
      
      if (keywords.length === 0) {
        const items = await db
          .select()
          .from(schema.knowledgeItems)
          .where(eq(schema.knowledgeItems.projectId, projectId))
          .limit(50)
        return items
      }

      // 构建搜索条件
      const searchConditions = keywords.map(keyword => 
        or(
          like(schema.knowledgeItems.title, `%${keyword}%`),
          like(schema.knowledgeItems.content, `%${keyword}%`)
        )
      )

      const items = await db
        .select()
        .from(schema.knowledgeItems)
        .where(and(
          eq(schema.knowledgeItems.projectId, projectId),
          or(...searchConditions)
        ))
        .limit(10)

      return items
    } catch (error) {
      console.error('Project knowledge search error:', error)
      return []
    }
  }

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

  private async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
    try {
      // 使用关键词搜索替代向量搜索
      const keywords = query.split(/\s+/).filter(k => k.length > 1).slice(0, 5)
      
      if (keywords.length === 0) {
        return []
      }

      // 构建搜索条件：标题或内容包含任一关键词
      const searchConditions = keywords.map(keyword => 
        or(
          like(schema.knowledgeItems.title, `%${keyword}%`),
          like(schema.knowledgeItems.content, `%${keyword}%`)
        )
      )

      const items = await db
        .select()
        .from(schema.knowledgeItems)
        .where(and(
          eq(schema.knowledgeItems.userId, 'default-user'),
          or(...searchConditions)
        ))
        .limit(10)

      return items
    } catch (error) {
      console.error('Knowledge search error:', error)
      return []
    }
  }

  // 使用指定模型提取记忆
  private async extractMemories(userMessage: string, aiResponse: string, modelKey: string): Promise<void> {
    try {
      const config = MODEL_CONFIG[modelKey]
      if (!config) {
        console.error(`Unknown model for memory extraction: ${modelKey}`)
        return
      }
      
      const apiKey = this.getApiKey(modelKey)
      
      const extractPrompt = `分析以下对话，判断是否包含值得长期记忆的用户信息。

【值得记忆】
- 用户的身份信息（姓名、职业、公司、职位）
- 明确表达的偏好（喜欢/不喜欢什么风格）
- 工作相关的习惯（每天几点开会、常用工具）
- 明确的指令（"以后用中文回答"、"不要用markdown"）

【不值得记忆】
- 临时性、一次性的问题
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
    { "type": "preference", "key": "回答语言", "value": "中文", "importance": 7 }
  ]
}

只返回 JSON，不要其他内容。`

      // 根据不同模型构建请求
      let apiUrl: string
      let modelId: string
      
      if (modelKey === 'deepseek') {
        apiUrl = 'https://api.deepseek.com/chat/completions'
        modelId = 'deepseek-chat'
      } else if (modelKey === 'kimi') {
        apiUrl = 'https://api.moonshot.cn/v1/chat/completions'
        modelId = 'moonshot-v1-8k'
      } else if (modelKey === 'doubao') {
        apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
        modelId = config.modelId // 使用配置的 endpoint ID
      } else {
        console.error(`Unsupported model for memory extraction: ${modelKey}`)
        return
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: '你是一个信息提取助手，从对话中提取用户的重要信息。' },
            { role: 'user', content: extractPrompt }
          ],
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        console.error('Memory extraction API error')
        return
      }

      const data = await response.json()
      const result = data.choices[0]?.message?.content || ''

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return

      const extracted = JSON.parse(jsonMatch[0])
      
      if (!extracted.shouldRemember || !extracted.memories) return

      for (const memory of extracted.memories) {
        if (memory.key && memory.value) {
          await this.saveMemory(memory)
        }
      }

      console.log(`Extracted ${extracted.memories.length} memories: ${extracted.reason}`)
    } catch (error) {
      console.error('Memory extraction failed:', error)
    }
  }

  private async saveMemory(memory: { type: string; key: string; value: string; importance: number }): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(schema.memories)
        .where(and(
          eq(schema.memories.userId, 'default-user'),
          eq(schema.memories.key, memory.key)
        ))
        .limit(1)

      if (existing.length > 0) {
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

  // 生成会话摘要
  async generateSessionSummary(messages: Array<{ from: string; content: string }>): Promise<{ summary: string; keyEvents: string[] }> {
    try {
      const apiKey = this.getApiKey('deepseek')
      
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

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个对话摘要助手，擅长提取对话要点。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        return { summary: '对话摘要生成失败', keyEvents: [] }
      }

      const data = await response.json()
      const result = data.choices[0]?.message?.content || ''

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
      const apiKey = this.getApiKey('deepseek')
      
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

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个意图识别助手。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        return { shouldCreate: false, suggestion: '' }
      }

      const data = await response.json()
      const result = data.choices[0]?.message?.content || ''

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

  // 语音识别 - 需要接入语音服务
  async asr(audioUrl: string): Promise<{ text: string }> {
    // 暂不支持，返回提示
    throw new Error('语音识别功能暂未配置，请联系管理员配置 ASR 服务')
  }

  // 向量嵌入 - 暂不支持
  async embedText(text: string): Promise<number[]> {
    throw new Error('向量嵌入功能暂未配置')
  }
}
