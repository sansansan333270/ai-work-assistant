import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// 使用 require 避免 TypeScript 导入问题
const BetterSqlite3 = require('better-sqlite3')

const sqlite = new BetterSqlite3('sqlite.db')
export const db = drizzle(sqlite, { schema })

export { schema }
