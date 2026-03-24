import Database from 'better-sqlite3';

const db = new Database('server/sqlite.db');

console.log('=== 数据库统计 ===\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('表列表:', tables.map(t => t.name).join(', '));
console.log('');

const counts = [
  ['笔记', 'notes'],
  ['记忆', 'memories'],
  ['知识库', 'knowledge_items'],
  ['技能', 'skills'],
  ['会话', 'sessions'],
  ['项目', 'projects'],
];

for (const [name, table] of counts) {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`${name}: ${result.count} 条`);
  } catch (e) {
    console.log(`${name}: 表不存在`);
  }
}

db.close();
