/**
 * Google OAuth2 认证服务
 * 使用 google-auth-library 验证 Google ID Token
 * 支持用户通过 Google 账号登录或注册
 */

import { OAuth2Client } from 'google-auth-library';
import db from './database.js';
import jwt from 'jsonwebtoken';

// JWT 配置（与 authService 保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Google OAuth2 客户端
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
let googleClient = null;

if (GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  console.log('✅ Google OAuth2 client initialized');
} else {
  console.log('⚠️  GOOGLE_CLIENT_ID not set - Google login disabled');
}

/**
 * 生成 JWT Token
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
 * 验证 Google ID Token 并获取用户信息
 * @param {string} idToken - Google 前端返回的 ID Token
 * @returns {object|null} - 验证后的 Google 用户信息或 null
 */
export async function verifyGoogleToken(idToken) {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    console.error('Google OAuth2 not configured');
    return null;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      givenName: payload.given_name,
      familyName: payload.family_name
    };
  } catch (err) {
    console.error('Google ID token verification failed:', err.message);
    return null;
  }
}

/**
 * 通过 Google 账号登录或注册用户
 * @param {string} idToken - Google ID Token
 * @returns {object} - 登录结果 { success, data, token, error, message }
 */
export async function loginOrRegisterWithGoogle(idToken) {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    return {
      success: false,
      error: 'google_not_configured',
      message: 'Google login is not configured on the server'
    };
  }

  // 验证 Google Token
  const googleUser = await verifyGoogleToken(idToken);
  if (!googleUser) {
    return {
      success: false,
      error: 'invalid_google_token',
      message: 'Invalid Google ID token'
    };
  }

  // 1. 尝试通过 google_id 查找用户
  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleUser.googleId);

  // 2. 如果没有找到，尝试通过 email 查找（已有账号的用户绑定）
  if (!user && googleUser.email) {
    const existingByEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(googleUser.email);
    if (existingByEmail) {
      // 将现有账号绑定到 Google
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleUser.googleId, existingByEmail.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingByEmail.id);
    }
  }

  // 3. 仍然没有找到，创建新用户
  if (!user) {
    const baseUsername = googleUser.givenName || googleUser.name || googleUser.email.split('@')[0];
    let username = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 15) || 'google_user';

    // 处理用户名冲突
    let attempt = 1;
    while (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
      const suffix = String(Date.now()).slice(-4);
      username = `${username.substring(0, 12)}${suffix}`;
      attempt++;
      if (attempt > 10) break;
    }

    try {
      // 使用随机密码（Google 用户不需要密码登录）
      const randomPassword = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      // 这里不需要 bcrypt，因为 Google 登录不走密码路径
      // 但为了数据库字段完整性，填入一个随机值
      const result = db.prepare(
        'INSERT INTO users (username, password, email, google_id) VALUES (?, ?, ?, ?)'
      ).run(username, 'google_oauth_no_password', googleUser.email, googleUser.googleId);

      // 更新今日新增用户统计
      const today = new Date().toISOString().split('T')[0];
      db.prepare(
        'UPDATE access_logs SET new_users = new_users + 1 WHERE visit_date = ?'
      ).run(today);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } catch (err) {
      console.error('Google user registration failed:', err);
      return {
        success: false,
        error: 'registration_failed',
        message: 'Failed to create user account, please try again'
      };
    }
  }

  // 4. 生成 JWT Token 并返回
  const token = generateToken(user.id, user.username);

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      googleUser: {
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture
      }
    },
    token
  };
}
