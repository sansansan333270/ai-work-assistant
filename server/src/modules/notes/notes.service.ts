import { Injectable } from '@nestjs/common'
import { eq, and, desc, like, or } from 'drizzle-orm'
import { db, schema } from '@/database'
import type { NewNote, Note } from '@/database/schema'

@Injectable()
export class NotesService {
  // 创建笔记
  async createNote(note: NewNote): Promise<Note> {
    const result = await db.insert(schema.notes).values(note).returning()
    return result[0]
  }

  // 获取笔记列表
  async getNotes(params: {
    userId?: string
    category?: string
    isStarred?: boolean
    isArchived?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<Note[]> {
    const { userId = 'default-user', category, isStarred, isArchived, search, limit = 50, offset = 0 } = params

    const conditions = [eq(schema.notes.userId, userId)]
    
    if (category) {
      conditions.push(eq(schema.notes.category, category))
    }

    if (isStarred !== undefined) {
      conditions.push(eq(schema.notes.isStarred, isStarred))
    }

    if (isArchived !== undefined) {
      conditions.push(eq(schema.notes.isArchived, isArchived))
    }

    if (search) {
      conditions.push(or(
        like(schema.notes.title, `%${search}%`),
        like(schema.notes.content, `%${search}%`)
      )!)
    }

    return db.select()
      .from(schema.notes)
      .where(and(...conditions))
      .orderBy(desc(schema.notes.createdAt))
      .limit(limit)
      .offset(offset)
  }

  // 获取单个笔记
  async getNoteById(id: number): Promise<Note | undefined> {
    const result = await db.select().from(schema.notes).where(eq(schema.notes.id, id)).limit(1)
    return result[0]
  }

  // 更新笔记
  async updateNote(id: number, updates: Partial<NewNote>): Promise<Note> {
    const result = await db
      .update(schema.notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.notes.id, id))
      .returning()
    return result[0]
  }

  // 删除笔记
  async deleteNote(id: number): Promise<void> {
    await db.delete(schema.notes).where(eq(schema.notes.id, id))
  }

  // 切换收藏状态
  async toggleStar(id: number): Promise<Note> {
    const note = await this.getNoteById(id)
    if (!note) throw new Error('Note not found')
    
    return this.updateNote(id, { isStarred: !note.isStarred })
  }

  // 归档笔记
  async archiveNote(id: number): Promise<Note> {
    return this.updateNote(id, { isArchived: true })
  }

  // 取消归档
  async unarchiveNote(id: number): Promise<Note> {
    return this.updateNote(id, { isArchived: false })
  }

  // 从AI对话创建笔记
  async createFromChat(params: {
    title: string
    content: string
    conversationContext?: string
    sourceId?: string
  }): Promise<Note> {
    return this.createNote({
      userId: 'default-user',
      title: params.title,
      content: params.content,
      sourceType: 'ai-chat',
      sourceId: params.sourceId,
      conversationContext: params.conversationContext,
    })
  }

  // 获取笔记统计
  async getStats(userId: string = 'default-user'): Promise<{
    total: number
    starred: number
    archived: number
    byCategory: Record<string, number>
  }> {
    const notes = await db.select().from(schema.notes).where(eq(schema.notes.userId, userId))

    const total = notes.length
    const starred = notes.filter(n => n.isStarred).length
    const archived = notes.filter(n => n.isArchived).length
    
    const byCategory: Record<string, number> = {}
    notes.forEach(note => {
      const cat = note.category || 'default'
      byCategory[cat] = (byCategory[cat] || 0) + 1
    })

    return { total, starred, archived, byCategory }
  }
}
