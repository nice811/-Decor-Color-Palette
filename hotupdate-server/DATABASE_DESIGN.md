# 第二阶段开发：数据库与用户系统

## 数据库选型：SQLite

SQLite 是轻量级嵌入式数据库，适合本项目的用户数据存储需求，无需额外部署数据库服务。

## 建表SQL语句

```sql
-- ============================================
-- 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户名索引（唯一约束自动创建）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 收藏表 (favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    color_data TEXT NOT NULL,
    palette_name TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 外键索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- 访问统计表 (access_logs)
-- ============================================
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

-- 日期索引
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(visit_date);

-- ============================================
-- 每日AI调用统计表 (ai_usage_logs)
-- ============================================
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
```

## 数据库设计说明

### 1. users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 自增主键 |
| username | TEXT | NOT NULL, UNIQUE | 用户账号，唯一索引 |
| password | TEXT | NOT NULL | 密码（加密存储） |
| email | TEXT | - | 邮箱（可选） |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2. favorites（收藏表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 自增主键 |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 关联用户ID，级联删除 |
| color_data | TEXT | NOT NULL | 配色JSON数据 |
| palette_name | TEXT | - | 配色方案名称 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 添加时间 |

**外键约束**：`FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- 用户删除时，对应收藏一并删除

### 3. access_logs（访问统计表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 自增主键 |
| visit_date | DATE | NOT NULL, UNIQUE | 访问日期 |
| visit_count | INTEGER | NOT NULL, DEFAULT 0 | 访问次数 |
| ai_requests | INTEGER | NOT NULL, DEFAULT 0 | AI生成次数 |
| new_users | INTEGER | NOT NULL, DEFAULT 0 | 新增用户数 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 4. ai_usage_logs（AI调用统计表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 自增主键 |
| log_date | DATE | NOT NULL, UNIQUE | 统计日期 |
| total_requests | INTEGER | NOT NULL, DEFAULT 0 | 总请求数 |
| successful_requests | INTEGER | NOT NULL, DEFAULT 0 | 成功次数 |
| failed_requests | INTEGER | NOT NULL, DEFAULT 0 | 失败次数 |
| fallback_requests | INTEGER | NOT NULL, DEFAULT 0 | 降级使用备用配色次数 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## API接口设计

### 用户认证接口

#### POST /api/auth/register - 用户注册
```json
// 请求
{
  "username": "john_doe",
  "password": "securePassword123",
  "email": "john@example.com"
}

// 响应成功
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe"
  },
  "token": "jwt_token_here"
}

// 响应失败
{
  "success": false,
  "error": "username_exists",
  "message": "Username already taken"
}
```

#### POST /api/auth/login - 用户登录
```json
// 请求
{
  "username": "john_doe",
  "password": "securePassword123"
}

// 响应成功
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe"
  },
  "token": "jwt_token_here"
}

// 响应失败
{
  "success": false,
  "error": "invalid_credentials",
  "message": "Invalid username or password"
}
```

### 收藏接口

#### GET /api/favorites - 获取用户收藏列表
```json
// 请求头
Authorization: Bearer <token>

// 响应
{
  "success": true,
  "data": [
    {
      "id": 1,
      "palette_name": "Modern Living Room",
      "color_data": [
        {"hex": "#E8DED1", "name": "Warm Beige"},
        {"hex": "#5D4E37", "name": "Dark Brown"}
      ],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/favorites - 添加收藏
```json
// 请求头
Authorization: Bearer <token>

// 请求
{
  "palette_name": "Modern Living Room",
  "color_data": [
    {"hex": "#E8DED1", "name": "Warm Beige"},
    {"hex": "#5D4E37", "name": "Dark Brown"}
  ]
}

// 响应
{
  "success": true,
  "data": {
    "id": 1,
    "palette_name": "Modern Living Room"
  }
}
```

#### DELETE /api/favorites/:id - 删除收藏
```json
// 响应
{
  "success": true,
  "message": "Favorite deleted"
}
```

### 统计接口

#### GET /api/stats/overview - 获取统计概览
```json
// 响应
{
  "success": true,
  "data": {
    "totalVisits": 15000,
    "todayVisits": 450,
    "totalAIRequests": 8500,
    "todayAIRequests": 120,
    "totalUsers": 250
  }
}
```

#### GET /api/stats/ai-usage - AI使用统计
```json
// 响应
{
  "success": true,
  "data": {
    "last7Days": [
      {
        "date": "2024-01-15",
        "total": 150,
        "success": 145,
        "failed": 2,
        "fallback": 3
      }
    ],
    "total": {
      "total": 8500,
      "success": 8200,
      "failed": 150,
      "fallback": 150
    }
  }
}
```

## 密码加密方案

使用 bcrypt 进行密码加密：

```javascript
import bcrypt from 'bcrypt';

// 加密密码
const hashedPassword = await bcrypt.hash(password, 10);

// 验证密码
const isValid = await bcrypt.compare(password, hashedPassword);
```

## JWT认证方案

使用 jsonwebtoken 生成和验证Token：

```javascript
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// 生成Token
const token = jwt.sign(
  { userId: user.id, username: user.username },
  SECRET_KEY,
  { expiresIn: '7d' }
);

// 验证Token
const decoded = jwt.verify(token, SECRET_KEY);
```

## 数据库初始化脚本

```javascript
// init-db.js
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('database.sqlite');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    color_data TEXT NOT NULL,
    palette_name TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
`);

export default db;
```

## 后续开发任务清单

- [ ] 集成 SQLite 数据库（better-sqlite3）
- [ ] 实现用户注册接口（密码加密存储）
- [ ] 实现用户登录接口（JWT认证）
- [ ] 实现收藏CRUD接口
- [ ] 实现访问统计功能
- [ ] 实现AI使用统计功能
- [ ] 前端登录/注册页面
- [ ] 前端收藏管理页面
- [ ] 后台统计页面

## 注意事项

1. **密码安全**：永远不要明文存储密码，使用bcrypt加密
2. **Token安全**：JWT密钥需要足够复杂，定期更换
3. **SQL注入**：使用参数化查询，避免SQL注入
4. **数据备份**：定期备份数据库文件
