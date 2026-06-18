/**
 * 统计服务
 * 提供访问统计和AI使用统计功能
 */

import db from './database.js';

/**
 * 记录页面访问
 */
export function recordVisit() {
  const today = new Date().toISOString().split('T')[0];

  // 确保今日记录存在
  const todayRecord = db.prepare('SELECT * FROM access_logs WHERE visit_date = ?').get(today);
  if (!todayRecord) {
    db.prepare('INSERT INTO access_logs (visit_date) VALUES (?)').run(today);
  }

  // 增加访问计数
  db.prepare(
    'UPDATE access_logs SET visit_count = visit_count + 1 WHERE visit_date = ?'
  ).run(today);
}

/**
 * 记录AI请求
 * @param {string} status - 状态：success, failed, fallback
 */
export function recordAIRequest(status) {
  const today = new Date().toISOString().split('T')[0];

  // 确保今日记录存在
  const todayRecord = db.prepare('SELECT * FROM ai_usage_logs WHERE log_date = ?').get(today);
  if (!todayRecord) {
    db.prepare('INSERT INTO ai_usage_logs (log_date) VALUES (?)').run(today);
  }

  // 更新统计
  const updateField = {
    success: 'successful_requests',
    failed: 'failed_requests',
    fallback: 'fallback_requests'
  }[status] || 'total_requests';

  db.prepare(
    `UPDATE ai_usage_logs SET total_requests = total_requests + 1, ${updateField} = ${updateField} + 1 WHERE log_date = ?`
  ).run(today);

  // 同时更新access_logs的ai_requests
  db.prepare(
    'UPDATE access_logs SET ai_requests = ai_requests + 1 WHERE visit_date = ?'
  ).run(today);
}

/**
 * 获取统计概览
 * @returns {object} - 统计数据
 */
export function getStatsOverview() {
  // 总访问量
  const totalVisits = db.prepare('SELECT SUM(visit_count) as total FROM access_logs').get();
  const totalAIRequests = db.prepare('SELECT SUM(ai_requests) as total FROM access_logs').get();
  const totalUsers = db.prepare('SELECT COUNT(*) as total FROM users').get();

  // 今日数据
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = db.prepare('SELECT visit_count FROM access_logs WHERE visit_date = ?').get(today);
  const todayAIRequests = db.prepare('SELECT ai_requests FROM access_logs WHERE visit_date = ?').get(today);
  const todayNewUsers = db.prepare('SELECT new_users FROM access_logs WHERE visit_date = ?').get(today);

  return {
    totalVisits: totalVisits.total || 0,
    todayVisits: todayVisits?.visit_count || 0,
    totalAIRequests: totalAIRequests.total || 0,
    todayAIRequests: todayAIRequests?.ai_requests || 0,
    totalUsers: totalUsers.total || 0,
    todayNewUsers: todayNewUsers?.new_users || 0
  };
}

/**
 * 获取AI使用统计（最近N天）
 * @param {number} days - 天数
 * @returns {array} - 统计数据列表
 */
export function getAIUsageStats(days = 7) {
  const stats = db.prepare(`
    SELECT
      log_date,
      total_requests,
      successful_requests,
      failed_requests,
      fallback_requests
    FROM ai_usage_logs
    ORDER BY log_date DESC
    LIMIT ?
  `).all(days);

  // 计算总计
  const total = db.prepare(`
    SELECT
      SUM(total_requests) as total_requests,
      SUM(successful_requests) as successful_requests,
      SUM(failed_requests) as failed_requests,
      SUM(fallback_requests) as fallback_requests
    FROM ai_usage_logs
  `).get();

  return {
    last7Days: stats,
    total: {
      total_requests: total.total_requests || 0,
      successful_requests: total.successful_requests || 0,
      failed_requests: total.failed_requests || 0,
      fallback_requests: total.fallback_requests || 0
    }
  };
}

/**
 * 获取访问统计（最近N天）
 * @param {number} days - 天数
 * @returns {array} - 统计数据列表
 */
export function getVisitStats(days = 30) {
  const stats = db.prepare(`
    SELECT
      visit_date,
      visit_count,
      ai_requests,
      new_users
    FROM access_logs
    ORDER BY visit_date DESC
    LIMIT ?
  `).all(days);

  return stats;
}

// ============================================
// 每日免费生成次数限制服务
// ============================================

const FREE_LIMIT_PER_DAY = 10; // 每日免费生成次数

/**
 * 检查用户/IP今日剩余生成次数
 * @param {number|null} userId - 用户ID（登录用户）
 * @param {string} ip - 客户端IP
 * @returns {object} - { remaining: number, limit: number, used: number }
 */
export function checkDailyLimit(userId, ip) {
  const today = new Date().toISOString().split('T')[0];

  // 登录用户：查询用户今日使用次数
  if (userId) {
    const userUsage = db.prepare(`
      SELECT daily_requests FROM user_daily_limits
      WHERE user_id = ? AND log_date = ?
    `).get(userId, today);

    const used = userUsage?.daily_requests || 0;
    return {
      remaining: Math.max(0, FREE_LIMIT_PER_DAY - used),
      limit: FREE_LIMIT_PER_DAY,
      used,
      isPremium: false // 可扩展为付费用户无限制
    };
  }

  // 未登录用户：查询IP今日使用次数
  const ipUsage = db.prepare(`
    SELECT daily_requests FROM ip_daily_limits
    WHERE ip_address = ? AND log_date = ?
  `).get(ip, today);

  const used = ipUsage?.daily_requests || 0;
  return {
    remaining: Math.max(0, FREE_LIMIT_PER_DAY - used),
    limit: FREE_LIMIT_PER_DAY,
    used,
    isPremium: false
  };
}

/**
 * 记录一次生成请求
 * @param {number|null} userId
 * @param {string} ip
 */
export function recordDailyUsage(userId, ip) {
  const today = new Date().toISOString().split('T')[0];

  if (userId) {
    // 用户记录
    const existing = db.prepare(`
      SELECT * FROM user_daily_limits WHERE user_id = ? AND log_date = ?
    `).get(userId, today);

    if (existing) {
      db.prepare(`
        UPDATE user_daily_limits SET daily_requests = daily_requests + 1
        WHERE user_id = ? AND log_date = ?
      `).run(userId, today);
    } else {
      db.prepare(`
        INSERT INTO user_daily_limits (user_id, log_date, daily_requests)
        VALUES (?, ?, 1)
      `).run(userId, today);
    }
  } else {
    // IP记录
    const existing = db.prepare(`
      SELECT * FROM ip_daily_limits WHERE ip_address = ? AND log_date = ?
    `).get(ip, today);

    if (existing) {
      db.prepare(`
        UPDATE ip_daily_limits SET daily_requests = daily_requests + 1
        WHERE ip_address = ? AND log_date = ?
      `).run(ip, today);
    } else {
      db.prepare(`
        INSERT INTO ip_daily_limits (ip_address, log_date, daily_requests)
        VALUES (?, ?, 1)
      `).run(ip, today);
    }
  }
}