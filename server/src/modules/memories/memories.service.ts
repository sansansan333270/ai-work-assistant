import { Injectable } from '@nestjs/common'
import { eq, and, desc, like } from 'drizzle-orm'
import { db, schema } from '@/database'
import type { NewMemory, Memory } from '@/database/schema'

@Injectable()
export class MemoriesService {
  // 创建记忆
  async createMemory(memory: NewMemory): Promise<Memory> {
    const result = await db.insert(schema.memories).values(memory).returning()
    return result[0]
  }

  // 批量创建记忆
  async createMemories(memories: NewMemory[]): Promise<Memory[]> {
    return db.insert(schema.memories).values(memories).returning()
  }

  // 获取记忆列表
  async getMemories(params: {
    userId?: string
    type?: string
    isActive?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<Memory[]> {
    const { userId = 'default-user', type, isActive, search, limit = 100, offset = 0 } = params

    const conditions = [eq(schema.memories.userId, userId)]

    if (type) {
      conditions.push(eq(schema.memories.type, type))
    }

    if (isActive !== undefined) {
      conditions.push(eq(schema.memories.isActive, isActive))
    }

    if (search) {
      conditions.push(like(schema.memories.key, `%${search}%`))
    }

    return db.select()
      .from(schema.memories)
      .where(and(...conditions))
      .orderBy(desc(schema.memories.importance), desc(schema.memories.createdAt))
      .limit(limit)
      .offset(offset)
  }

  // 获取单个记忆
  async getMemoryById(id: number): Promise<Memory | undefined> {
    const result = await db.select().from(schema.memories).where(eq(schema.memories.id, id)).limit(1)
    return result[0]
  }

  // 更新记忆
  async updateMemory(id: number, updates: Partial<NewMemory>): Promise<Memory> {
    const result = await db
      .update(schema.memories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.memories.id, id))
      .returning()
    return result[0]
  }

  // 删除记忆
  async deleteMemory(id: number): Promise<void> {
    await db.delete(schema.memories).where(eq(schema.memories.id, id))
  }

  // 激活/停用记忆
  async toggleActive(id: number): Promise<Memory> {
    const memory = await this.getMemoryById(id)
    if (!memory) throw new Error('Memory not found')
    
    return this.updateMemory(id, { isActive: !memory.isActive })
  }

  // 记录访问
  async recordAccess(id: number): Promise<void> {
    const memory = await this.getMemoryById(id)
    if (memory) {
      await this.updateMemory(id, {
        lastAccessedAt: new Date(),
        accessCount: (memory.accessCount || 0) + 1,
      })
    }
  }

  // 按类型获取记忆
  async getMemoriesByType(type: string): Promise<Memory[]> {
    return this.getMemories({ type, isActive: true })
  }

  // 获取相关记忆（用于AI上下文）
  async getRelevantMemories(context: string, limit: number = 10): Promise<Memory[]> {
    // 简单实现：获取所有激活的记忆，按重要性和访问次数排序
    // TODO: 可以接入向量搜索来提高相关性
    const memories = await db
      .select()
      .from(schema.memories)
      .where(and(eq(schema.memories.userId, 'default-user'), eq(schema.memories.isActive, true)))
      .orderBy(desc(schema.memories.importance), desc(schema.memories.accessCount))
      .limit(limit)
    
    return memories
  }

  // 提取并保存记忆（从对话中）
  async extractAndSaveMemory(params: {
    type: string
    key: string
    value: string
    source?: string
    importance?: number
  }): Promise<Memory> {
    // 检查是否已存在相同key的记忆
    const existing = await db
      .select()
      .from(schema.memories)
      .where(and(eq(schema.memories.userId, 'default-user'), eq(schema.memories.key, params.key)))
      .limit(1)

    if (existing[0]) {
      // 更新现有记忆
      return this.updateMemory(existing[0].id, {
        value: params.value,
        importance: params.importance || existing[0].importance,
        source: params.source,
        updatedAt: new Date(),
      })
    }

    // 创建新记忆
    return this.createMemory({
      userId: 'default-user',
      type: params.type,
      key: params.key,
      value: params.value,
      source: params.source,
      importance: params.importance || 5,
    })
  }

  // 获取记忆统计
  async getStats(): Promise<{
    total: number
    active: number
    byType: Record<string, number>
    avgImportance: number
  }> {
    const memories = await db.select().from(schema.memories).where(eq(schema.memories.userId, 'default-user'))

    const total = memories.length
    const active = memories.filter(m => m.isActive).length
    const avgImportance = memories.length > 0
      ? memories.reduce((sum, m) => sum + (m.importance || 0), 0) / memories.length
      : 0

    const byType: Record<string, number> = {}
    memories.forEach(memory => {
      byType[memory.type] = (byType[memory.type] || 0) + 1
    })

    return { total, active, byType, avgImportance }
  }
}
