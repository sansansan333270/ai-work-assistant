import { Injectable } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { sessions } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'

const sqlite = new Database('data/app.db')
const db = drizzle(sqlite)

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
  async getSessionList(userId: string = 'default-user') {
    const result = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        model: sessions.model,
        mode: sessions.mode,
        messageCount: sessions.messageCount,
        lastMessageAt: sessions.lastMessageAt,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
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
        title: data.title || '新对话',
        model: data.model || 'doubao',
        mode: data.mode || 'standard',
        messages: JSON.stringify(messages),
        messageCount: messages.length,
        lastMessageAt: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : null,
      })
      .returning({ id: sessions.id })
    
    return result[0]
  }

  // 更新会话
  async updateSession(sessionId: number, data: {
    title?: string
    messages?: Message[]
    model?: string
    mode?: string
  }, userId: string = 'default-user') {
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (data.title) updateData.title = data.title
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
    
    return this.getSession(sessionId, userId)
  }

  // 删除会话
  async deleteSession(sessionId: number, userId: string = 'default-user') {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))
    
    return { success: true }
  }

  // 清空所有会话
  async clearAllSessions(userId: string = 'default-user') {
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
    
    return { success: true }
  }
}
