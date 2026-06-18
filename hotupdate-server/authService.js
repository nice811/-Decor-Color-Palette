/**
 * 用户认证服务
 * 提供用户注册、登录、JWT验证等功能
 */

import db from './database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天

// 密码加密盐值
const SALT_ROUNDS = 10;

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱（可选）
 * @returns {object} - 注册结果
 */
export function registerUser(username, password, email = null) {
  // 验证用户名
  if (!username || username.length < 3 || username.length > 20) {
    return {
      success: false,
      error: 'invalid_username',
      message: 'Username must be between 3 and 20 characters'
    };
  }

  // 验证密码
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'invalid_password',
      message: 'Password must be at least 6 characters'
    };
  }

  // 检查用户名是否已存在
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return {
      success: false,
      error: 'username_exists',
      message: 'Username already taken'
    };
  }

  // 加密密码
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // 创建用户
  try {
    const result = db.prepare(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)'
    ).run(username, hashedPassword, email);

    // 更新今日新增用户统计
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      'UPDATE access_logs SET new_users = new_users + 1 WHERE visit_date = ?'
    ).run(today);

    // 生成JWT Token
    const token = generateToken(result.lastInsertRowid, username);

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        username,
        email
      },
      token
    };
  } catch (err) {
    console.error('Registration error:', err);
    return {
      success: false,
      error: 'registration_failed',
      message: 'Registration failed, please try again'
    };
  }
}

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {object} - 登录结果
 */
export function loginUser(username, password) {
  // 验证输入
  if (!username || !password) {
    return {
      success: false,
      error: 'missing_credentials',
      message: 'Username and password are required'
    };
  }

  // 查找用户
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return {
      success: false,
      error: 'invalid_credentials',
      message: 'Invalid username or password'
    };
  }

  // 验证密码
  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return {
      success: false,
      error: 'invalid_credentials',
      message: 'Invalid username or password'
    };
  }

  // 生成JWT Token
  const token = generateToken(user.id, user.username);

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    token
  };
}

/**
 * 生成JWT Token
 * @param {number} userId - 用户ID
 * @param {string} username - 用户名
 * @returns {string} - JWT Token
 */
function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 验证JWT Token
 * @param {string} token - JWT Token
 * @returns {object|null} - 解码后的用户信息或null
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('Token verification error:', err.message);
    return null;
  }
}

/**
 * 从请求中提取用户信息
 * @param {object} req - Express请求对象
 * @returns {object|null} - 用户信息或null
 */
export function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * 获取用户信息
 * @param {number} userId - 用户ID
 * @returns {object|null} - 用户信息
 */
export function getUserById(userId) {
  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(userId);
  return user || null;
}

/**
 * 认证中间件
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - 下一个中间件
 */
export function authMiddleware(req, res, next) {
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }

  // 将用户信息附加到请求对象
  req.user = user;
  next();
}