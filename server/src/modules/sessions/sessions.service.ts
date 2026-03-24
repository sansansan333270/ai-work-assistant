import { Injectable } from '@nestjs/common'
import { db } from '../../database'
import { sessions, sessionSummaries, projects } from '../../database/schema'
import { eq, desc, and } from 'drizzle-orm'

export interface Message {
  id: string
  type: 'text' | 'image'
  content: string
  from: 'user' | 'ai'
  timestamp: number
}

@Injectable()
export class SessionsService {
  // 获取所有会话列表
  async getSessionList(params: {
    userId?: string
    projectId?: number
  } = {}) {
    const { userId = 'default-user', projectId } = params
    
    const conditions = [eq(sessions.userId, userId)]
    
    if (projectId !== undefined) {
      if (projectId === 0) {
        // 获取未关联项目的会话
        conditions.push(eq(sessions.projectId, null as any))
      } else {
        conditions.push(eq(sessions.projectId, projectId))
      }
    }
    
    const result = await db
      .select({
        id: sessions.id,
        projectId: sessions.projectId,
        title: sessions.title,
        model: sessions.model,
        mode: sessions.mode,
        messageCount: sessions.messageCount,
        lastMessageAt: sessions.lastMessageAt,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(and(...conditions))
      .orderBy(desc(sessions.updatedAt))
    
    return result
  }

  // 获取单个会话详情
  async getSession(sessionId: number, userId: string = 'default-user') {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)
    
    if (result.length === 0) {
      return null
    }
    
    const session = result[0]
    return {
      ...session,
      messages: JSON.parse(session.messages || '[]'),
    }
  }

  // 创建新会话
  async createSession(data: {
    userId?: string
    projectId?: number
    title?: string
    model?: string
    mode?: string
    messages?: Message[]
  }) {
    const userId = data.userId || 'default-user'
    const messages = data.messages || []
    
    const result = await db
      .insert(sessions)
      .values({
        userId,
        projectId: data.projectId || null,
        title: data.title || '新对话',
        model: data.model || 'doubao',
        mode: data.mode || 'standard',
        messages: JSON.stringify(messages),
        messageCount: messages.length,
        lastMessageAt: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : null,
      })
      .returning({ id: sessions.id })
    
    // 如果关联了项目，更新项目的会话计数和活跃时间
    if (data.projectId) {
      await this.updateProjectActivity(data.projectId)
    }
    
    return result[0]
  }

  // 更新会话
  async updateSession(sessionId: number, data: {
    title?: string
    projectId?: number
    messages?: Message[]
    model?: string
    mode?: string
  }, userId: string = 'default-user') {
    // 先获取原会话信息
    const originalSession = await this.getSession(sessionId, userId)
    
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (data.title) updateData.title = data.title
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null
    if (data.messages) {
      updateData.messages = JSON.stringify(data.messages)
      updateData.messageCount = data.messages.length
      updateData.lastMessageAt = data.messages.length > 0 
        ? new Date(data.messages[data.messages.length - 1].timestamp) 
        : null
      // 自动生成标题（取第一条用户消息的前20字）
      if (data.messages.length > 0) {
        const firstUserMsg = data.messages.find(m => m.from === 'user')
        if (firstUserMsg && firstUserMsg.content) {
          updateData.title = firstUserMsg.content.substring(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
        }
      }
    }
    if (data.model) updateData.model = data.model
    if (data.mode) updateData.mode = data.mode
    
    await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, sessionId))
    
    // 如果项目变更，更新相关项目的活跃时间
    if (data.projectId !== undefined && data.projectId !== originalSession?.projectId) {
      if (data.projectId) {
        await this.updateProjectActivity(data.projectId)
      }
      if (originalSession?.projectId) {
        await this.updateProjectActivity(originalSession.projectId)
      }
    }
    
    return this.getSession(sessionId, userId)
  }

  // 删除会话
  async deleteSession(sessionId: number, userId: string = 'default-user') {
    // 先获取会话信息，用于更新项目计数
    const session = await this.getSession(sessionId, userId)
    
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))
    
    // 如果关联了项目，更新项目活跃时间
    if (session?.projectId) {
      await this.updateProjectActivity(session.projectId)
    }
    
    return { success: true }
  }

  // 清空所有会话
  async clearAllSessions(userId: string = 'default-user') {
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
    
    return { success: true }
  }

  // 更新项目活跃时间（私有方法）
  private async updateProjectActivity(projectId: number) {
    await db
      .update(projects)
      .set({ 
        lastActiveAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(projects.id, projectId))
  }

  // 创建会话摘要
  async createSessionSummary(data: {
    sessionId: number
    projectId?: number
    summary: string
    keyEvents?: string[]
    wordCount?: number
  }) {
    const result = await db
      .insert(sessionSummaries)
      .values({
        userId: 'default-user',
        sessionId: data.sessionId,
        projectId: data.projectId || null,
        summary: data.summary,
        keyEvents: JSON.stringify(data.keyEvents || []),
        wordCount: data.wordCount || 0,
      })
      .returning({ id: sessionSummaries.id })
    
    return result[0]
  }

  // 获取项目的会话摘要列表
  async getProjectSummaries(projectId: number, limit: number = 20) {
    const result = await db
      .select()
      .from(sessionSummaries)
      .where(eq(sessionSummaries.projectId, projectId))
      .orderBy(desc(sessionSummaries.createdAt))
      .limit(limit)
    
    return result.map(s => ({
      ...s,
      keyEvents: JSON.parse(s.keyEvents || '[]'),
    }))
  }

  // 获取项目最近的摘要（用于上下文注入）
  async getRecentSummaries(projectId: number, days: number = 7): Promise<string[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const result = await db
      .select({ summary: sessionSummaries.summary, createdAt: sessionSummaries.createdAt })
      .from(sessionSummaries)
      .where(eq(sessionSummaries.projectId, projectId))
      .orderBy(desc(sessionSummaries.createdAt))
      .limit(10)
    
    return result.map(s => s.summary)
  }
}
