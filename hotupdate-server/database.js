import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'database.sqlite');

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// ============================================
// 创建表
// ============================================

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 收藏表
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    color_data TEXT NOT NULL,
    palette_name TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 访问统计表
db.exec(`
  CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_date DATE NOT NULL,
    visit_count INTEGER NOT NULL DEFAULT 0,
    ai_requests INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(visit_date)
  );
`);

// AI使用统计表
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_date DATE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    fallback_requests INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(log_date)
  );
`);

// 用户每日限制表
db.exec(`
  CREATE TABLE IF NOT EXISTS user_daily_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    log_date DATE NOT NULL,
    daily_requests INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, log_date)
  );
`);

// IP每日限制表
db.exec(`
  CREATE TABLE IF NOT EXISTS ip_daily_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    log_date DATE NOT NULL,
    daily_requests INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, log_date)
  );
`);

// ============================================
// 创建索引
// ============================================

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(visit_date);
  CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_date ON ai_usage_logs(log_date);
`);

// ============================================
// 创建触发器：自动更新updated_at
// ============================================

db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_users_timestamp
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_access_logs_timestamp
  AFTER UPDATE ON access_logs
  FOR EACH ROW
  BEGIN
    UPDATE access_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

// ============================================
// 初始化今日访问统计
// ============================================

const today = new Date().toISOString().split('T')[0];
const todayStats = db.prepare('SELECT * FROM access_logs WHERE visit_date = ?').get(today);

if (!todayStats) {
  db.prepare('INSERT INTO access_logs (visit_date) VALUES (?)').run(today);
}

// ============================================
// 初始化今日AI使用统计
// ============================================

const todayAIStats = db.prepare('SELECT * FROM ai_usage_logs WHERE log_date = ?').get(today);

if (!todayAIStats) {
  db.prepare('INSERT INTO ai_usage_logs (log_date) VALUES (?)').run(today);
}

console.log('✅ Database initialized successfully');
console.log(`📁 Database path: ${DB_PATH}`);
console.log(`📊 Tables: users, favorites, access_logs, ai_usage_logs`);

export default db;