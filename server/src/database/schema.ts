import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 项目表
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  name: text('name').notNull(), // 项目名称
  type: text('type').notNull().default('other'), // 类型：novel, article, code, other
  description: text('description').default(''), // 项目简介
  settings: text('settings').default('{}'), // JSON: 核心设定（人物、世界观等）
  outline: text('outline').default('{}'), // JSON: 大纲/目录结构
  writingStyle: text('writing_style').default('{}'), // JSON: 风格配置（语调、视角、参考样例）
  currentProgress: text('current_progress').default(''), // 当前进度描述
  status: text('status').notNull().default('active'), // active, paused, completed
  sessionCount: integer('session_count').default(0), // 关联会话数量
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }), // 最后活跃时间
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 笔记表
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('default'), // 分类：default, work, study, life, creation
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
  projectId: integer('project_id').references(() => projects.id), // 关联的项目ID
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // 分类：character, scene, plot, setting
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

// 会话表
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  projectId: integer('project_id').references(() => projects.id), // 关联的项目ID
  title: text('title').notNull().default('新对话'), // 会话标题
  messages: text('messages').notNull().default('[]'), // 消息列表（JSON）
  model: text('model').default('doubao'), // 使用的模型
  mode: text('mode').default('standard'), // 对话模式
  messageCount: integer('message_count').default(0), // 消息数量
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }), // 最后消息时间
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 会话摘要表
export const sessionSummaries = sqliteTable('session_summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().default('default-user'),
  sessionId: integer('session_id').references(() => sessions.id), // 关联的会话ID
  projectId: integer('project_id').references(() => projects.id), // 关联的项目ID
  summary: text('summary').notNull(), // AI 生成的摘要
  keyEvents: text('key_events').default('[]'), // JSON: 关键事件
  wordCount: integer('word_count').default(0), // 本次创作字数
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// 导出类型
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Memory = typeof memories.$inferSelect
export type NewMemory = typeof memories.$inferInsert
export type KnowledgeItem = typeof knowledgeItems.$inferSelect
export type NewKnowledgeItem = typeof knowledgeItems.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type SessionSummary = typeof sessionSummaries.$inferSelect
export type NewSessionSummary = typeof sessionSummaries.$inferInsert
