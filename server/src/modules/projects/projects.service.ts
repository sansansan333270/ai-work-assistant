import { Injectable } from '@nestjs/common'
import { eq, and, desc, like, or } from 'drizzle-orm'
import { db, schema } from '@/database'
import type { NewProject, Project } from '@/database/schema'

@Injectable()
export class ProjectsService {
  // 创建项目
  async createProject(project: NewProject): Promise<Project> {
    const result = await db.insert(schema.projects).values(project).returning()
    return result[0]
  }

  // 获取项目列表
  async getProjects(params: {
    userId?: string
    type?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<Project[]> {
    const { userId = 'default-user', type, status, search, limit = 50, offset = 0 } = params

    const conditions = [eq(schema.projects.userId, userId)]

    if (type) {
      conditions.push(eq(schema.projects.type, type))
    }

    if (status) {
      conditions.push(eq(schema.projects.status, status))
    }

    if (search) {
      conditions.push(or(
        like(schema.projects.name, `%${search}%`),
        like(schema.projects.description, `%${search}%`)
      )!)
    }

    return db.select()
      .from(schema.projects)
      .where(and(...conditions))
      .orderBy(desc(schema.projects.lastActiveAt), desc(schema.projects.createdAt))
      .limit(limit)
      .offset(offset)
  }

  // 获取单个项目
  async getProjectById(id: number): Promise<Project | undefined> {
    const result = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1)
    return result[0]
  }

  // 更新项目
  async updateProject(id: number, updates: Partial<NewProject>): Promise<Project> {
    const result = await db
      .update(schema.projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning()
    return result[0]
  }

  // 删除项目
  async deleteProject(id: number): Promise<void> {
    // 先删除关联的知识条目
    await db.delete(schema.knowledgeItems).where(eq(schema.knowledgeItems.projectId, id))
    // 删除关联的会话摘要
    await db.delete(schema.sessionSummaries).where(eq(schema.sessionSummaries.projectId, id))
    // 将关联的会话的 projectId 设为 null
    await db.update(schema.sessions)
      .set({ projectId: null })
      .where(eq(schema.sessions.projectId, id))
    // 删除项目
    await db.delete(schema.projects).where(eq(schema.projects.id, id))
  }

  // 更新项目活跃时间
  async updateLastActive(id: number): Promise<void> {
    await db.update(schema.projects)
      .set({ 
        lastActiveAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(schema.projects.id, id))
  }

  // 增加会话计数
  async incrementSessionCount(id: number): Promise<void> {
    const project = await this.getProjectById(id)
    if (project) {
      await db.update(schema.projects)
        .set({ 
          sessionCount: (project.sessionCount || 0) + 1,
          updatedAt: new Date() 
        })
        .where(eq(schema.projects.id, id))
    }
  }

  // 获取项目统计
  async getStats(userId: string = 'default-user'): Promise<{
    total: number
    active: number
    paused: number
    completed: number
    byType: Record<string, number>
  }> {
    const projects = await db.select().from(schema.projects).where(eq(schema.projects.userId, userId))

    const total = projects.length
    const active = projects.filter(p => p.status === 'active').length
    const paused = projects.filter(p => p.status === 'paused').length
    const completed = projects.filter(p => p.status === 'completed').length

    const byType: Record<string, number> = {}
    projects.forEach(project => {
      byType[project.type] = (byType[project.type] || 0) + 1
    })

    return { total, active, paused, completed, byType }
  }

  // 更新项目进度
  async updateProgress(id: number, progress: string): Promise<Project> {
    return this.updateProject(id, { currentProgress: progress })
  }

  // 更新项目设定
  async updateSettings(id: number, settings: Record<string, any>): Promise<Project> {
    return this.updateProject(id, { settings: JSON.stringify(settings) })
  }

  // 更新项目大纲
  async updateOutline(id: number, outline: Record<string, any>): Promise<Project> {
    return this.updateProject(id, { outline: JSON.stringify(outline) })
  }

  // 更新写作风格
  async updateWritingStyle(id: number, style: Record<string, any>): Promise<Project> {
    return this.updateProject(id, { writingStyle: JSON.stringify(style) })
  }

  // 获取项目的完整上下文（用于 AI 对话注入）
  async getProjectContext(id: number): Promise<{
    project: Project
    settings: Record<string, any>
    outline: Record<string, any>
    writingStyle: Record<string, any>
  } | null> {
    const project = await this.getProjectById(id)
    if (!project) return null

    return {
      project,
      settings: project.settings ? JSON.parse(project.settings) : {},
      outline: project.outline ? JSON.parse(project.outline) : {},
      writingStyle: project.writingStyle ? JSON.parse(project.writingStyle) : {},
    }
  }
}
