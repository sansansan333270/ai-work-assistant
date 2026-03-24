import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 笔记表
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('default'), // 分类：default, work, study, life
  tags: text('tags').default(''), // 标签，逗号分隔
  sourceType: text('source_type').notNull(), // 来源类型：ai-chat, manual, knowledge
  sourceId: text('source_id'), // 来源ID（如对话ID）
  conversationContext: text('conversation_context'), // 对话上下文（JSON）
  isStarred: integer('is_starred', { mode: 'boolean' }).default(false), // 是否收藏
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false), // 是否归档
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// AI 记忆表
export const memories = sqliteTable('memories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  type: text('type').notNull(), // 类型：preference, fact, context, instruction
  key: text('key').notNull(), // 记忆键（如 "用户偏好"、"工作项目"）
  value: text('value').notNull(), // 记忆值
  importance: integer('importance').default(5), // 重要程度 1-10
  confidence: integer('confidence').default(100), // 置信度 0-100
  source: text('source'), // 来源（对话ID、笔记ID等）
  isActive: integer('is_active', { mode: 'boolean' }).default(true), // 是否激活
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }), // 最后访问时间
  accessCount: integer('access_count').default(0), // 访问次数
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 知识库表（从笔记整理而来）
export const knowledgeItems = sqliteTable('knowledge_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  noteId: integer('note_id').references(() => notes.id), // 关联的笔记ID
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // 分类
  tags: text('tags').default(''), // 标签，逗号分隔
  embedding: text('embedding'), // 向量嵌入（JSON数组）
  metadata: text('metadata'), // 元数据（JSON）
  isPublic: integer('is_public', { mode: 'boolean' }).default(false), // 是否公开
  accessCount: integer('access_count').default(0), // 访问次数
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 技能表
export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  name: text('name').notNull(), // 技能名称
  description: text('description').default(''), // 技能描述
  prompt: text('prompt').notNull(), // 技能提示词/指令
  category: text('category').default('custom'), // 分类：writing, coding, analysis, custom
  icon: text('icon').default('Sparkles'), // 图标名称
  isPublic: integer('is_public', { mode: 'boolean' }).default(false), // 是否公开
  usageCount: integer('usage_count').default(0), // 使用次数
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 导出类型
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Memory = typeof memories.$inferSelect
export type NewMemory = typeof memories.$inferInsert
export type KnowledgeItem = typeof knowledgeItems.$inferSelect
export type NewKnowledgeItem = typeof knowledgeItems.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
