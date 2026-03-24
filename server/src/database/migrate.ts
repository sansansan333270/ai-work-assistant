import { sql } from 'drizzle-orm'
import { db } from './index'

async function migrate() {
  console.log('Creating tables...')

  // 创建笔记表
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'default',
      tags TEXT DEFAULT '',
      source_type TEXT NOT NULL,
      source_id TEXT,
      conversation_context TEXT,
      is_starred INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // 创建记忆表
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      type TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      importance INTEGER DEFAULT 5,
      confidence INTEGER DEFAULT 100,
      source TEXT,
      is_active INTEGER DEFAULT 1,
      last_accessed_at INTEGER,
      access_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // 创建知识库表
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      note_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT DEFAULT '',
      embedding TEXT,
      metadata TEXT,
      is_public INTEGER DEFAULT 0,
      access_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (note_id) REFERENCES notes(id)
    )
  `)

  // 创建技能表
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      prompt TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      icon TEXT DEFAULT 'Sparkles',
      is_public INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  console.log('Tables created successfully!')
}

migrate().catch(console.error)
