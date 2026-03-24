import { Injectable } from '@nestjs/common'
import { db, schema } from '@/database'

@Injectable()
export class DataExportService {
  /**
   * 导出所有用户数据
   */
  async exportAllData() {
    const data: {
      exportInfo: {
        exportedAt: string
        version: string
        app: string
      }
      notes: unknown[]
      memories: unknown[]
      knowledgeItems: unknown[]
      skills: unknown[]
      sessions: unknown[]
    } = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        app: 'AI工作助手',
      },
      notes: [],
      memories: [],
      knowledgeItems: [],
      skills: [],
      sessions: [],
    }

    // 安全查询每个表
    try {
      data.notes = await db.select().from(schema.notes)
    } catch (e) {
      console.error('Failed to query notes:', e)
    }

    try {
      data.memories = await db.select().from(schema.memories)
    } catch (e) {
      console.error('Failed to query memories:', e)
    }

    try {
      data.knowledgeItems = await db.select().from(schema.knowledgeItems)
    } catch (e) {
      console.error('Failed to query knowledgeItems:', e)
    }

    try {
      data.skills = await db.select().from(schema.skills)
    } catch (e) {
      console.error('Failed to query skills:', e)
    }

    try {
      data.sessions = await db.select().from(schema.sessions)
    } catch (e) {
      console.error('Failed to query sessions:', e)
    }

    return data
  }

  /**
   * 获取数据统计信息
   */
  async getDataStats() {
    const stats = {
      notes: 0,
      memories: 0,
      knowledgeItems: 0,
      skills: 0,
      sessions: 0,
      total: 0,
    }

    // 安全查询每个表的计数
    try {
      const result = await db.select().from(schema.notes)
      stats.notes = result.length
    } catch (e) {
      console.error('Failed to count notes:', e)
    }

    try {
      const result = await db.select().from(schema.memories)
      stats.memories = result.length
    } catch (e) {
      console.error('Failed to count memories:', e)
    }

    try {
      const result = await db.select().from(schema.knowledgeItems)
      stats.knowledgeItems = result.length
    } catch (e) {
      console.error('Failed to count knowledgeItems:', e)
    }

    try {
      const result = await db.select().from(schema.skills)
      stats.skills = result.length
    } catch (e) {
      console.error('Failed to count skills:', e)
    }

    try {
      const result = await db.select().from(schema.sessions)
      stats.sessions = result.length
    } catch (e) {
      console.error('Failed to count sessions:', e)
    }

    stats.total = stats.notes + stats.memories + stats.knowledgeItems + stats.skills + stats.sessions
    return stats
  }
}
