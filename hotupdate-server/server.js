import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// 导入服务模块
import db from './database.js';
import { registerUser, loginUser, getUserFromRequest, authMiddleware } from './authService.js';
import { loginOrRegisterWithGoogle } from './googleOAuthService.js';
import { getFavorites, addFavorite, deleteFavorite, updateFavoriteName, getFavoritesCount } from './favoriteService.js';
import { recordVisit, recordAIRequest, getStatsOverview, getAIUsageStats, getVisitStats, checkDailyLimit, recordDailyUsage } from './statsService.js';

// 加载.env环境变量
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
  fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// AI配色生成配置（从环境变量读取）
// ============================================
const AI_CONFIG = {
  baseUrl: process.env.AI_BASE_URL || 'http://127.0.0.1:3000/v1',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  timeout: parseInt(process.env.AI_TIMEOUT) || 15000, // 默认15秒超时
  maxRetries: 2 // 最大重试次数
};

// 语言支持配置
const ALLOWED_LANGUAGES = ['en', 'de', 'it']; // 英文、意大利语

// CORS配置：从环境变量读取允许的前端域名
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';

app.use(cors({
  origin: ALLOW_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'admin', 'dist')));

// ============================================
// 存储目录配置
// ============================================
const STORAGE_DIR = path.join(__dirname, 'storage');
const VERSION_FILE = path.join(STORAGE_DIR, 'version.json');
const CONTENT_DIR = path.join(STORAGE_DIR, 'content');
const LOG_FILE = path.join(STORAGE_DIR, 'update-log.json');
const SYNC_CONFIG_FILE = path.join(STORAGE_DIR, 'sync-config.json');
const STATS_FILE = path.join(STORAGE_DIR, 'sync-stats.json');
const AI_LOG_FILE = path.join(STORAGE_DIR, 'ai-call-log.json');

// ============================================
// IP风控配置（内存存储，生产环境建议使用Redis）
// ============================================
const rateLimitMap = new Map(); // { ip: { count: number, resetTime: number } }
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟窗口
const RATE_LIMIT_MAX = 5; // 每分钟最多5次

/**
 * IP限流检查
 * @param {string} ip - 客户端IP地址
 * @returns {object} - { allowed: boolean, remaining: number, resetIn: number }
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // 如果记录不存在或已过期，创建新记录
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  // 如果次数超限
  if (record.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now
    };
  }

  // 次数+1
  record.count++;
  rateLimitMap.set(ip, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - record.count,
    resetIn: record.resetTime - now
  };
}

// 定期清理过期记录（每5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ============================================
// AI调用日志记录
// ============================================
function logAICall(logEntry) {
  try {
    let logs = [];
    if (fs.existsSync(AI_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(AI_LOG_FILE, 'utf-8'));
    }

    logs.unshift({
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...logEntry
    });

    // 保留最近1000条日志
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000);
    }

    fs.writeFileSync(AI_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to write AI log:', err);
  }
}

// ============================================
// 备用静态配色（AI超时或异常时返回）
// ============================================
const FALLBACK_PALETTES = [
  [
    { hex: '#E8DED1', name: 'Warm Beige' },
    { hex: '#5D4E37', name: 'Dark Brown' },
    { hex: '#C9B99A', name: 'Sand' },
    { hex: '#8B7355', name: 'Taupe' },
    { hex: '#F5F0E8', name: 'Cream' }
  ],
  [
    { hex: '#D4E5ED', name: 'Soft Blue' },
    { hex: '#4A6572', name: 'Slate' },
    { hex: '#B8C9D4', name: 'Light Steel' },
    { hex: '#7A9BA8', name: 'Sea Mist' },
    { hex: '#F0F5F7', name: 'Ice White' }
  ],
  [
    { hex: '#E6DDD4', name: 'Stone' },
    { hex: '#6B5B4F', name: 'Umber' },
    { hex: '#A69585', name: 'Warm Gray' },
    { hex: '#C4B8A8', name: 'Linen' },
    { hex: '#FAF8F5', name: 'Pearl' }
  ],
  [
    { hex: '#D9E5D6', name: 'Sage Green' },
    { hex: '#5A6B52', name: 'Forest' },
    { hex: '#A8C4A2', name: 'Mint' },
    { hex: '#7A9B73', name: 'Olive' },
    { hex: '#F2F7EF', name: 'Mint Cream' }
  ],
  [
    { hex: '#F5E6D3', name: 'Champagne' },
    { hex: '#8B6F47', name: 'Caramel' },
    { hex: '#D4B896', name: 'Bisque' },
    { hex: '#C9A77D', name: 'Tan' },
    { hex: '#FDF8F0', name: 'Linen White' }
  ]
];

/**
 * 获取随机备用配色
 * @returns {Array} - 5组HEX色值和颜色名称
 */
function getRandomFallbackPalette() {
  const index = Math.floor(Math.random() * FALLBACK_PALETTES.length);
  return FALLBACK_PALETTES[index];
}

// ============================================
// AI配色生成提示词
// ============================================
const AI_SYSTEM_PROMPT = `You are a professional home decor color palette generator.
Generate exactly 5 colors for a home decoration palette.
Output ONLY valid JSON array, no other text.
Each color must have:
- "hex": 6-character hex code (e.g., "#E8DED1")
- "name": English color name (e.g., "Warm Beige")

Example output format:
[
  {"hex": "#E8DED1", "name": "Warm Beige"},
  {"hex": "#5D4E37", "name": "Dark Brown"},
  {"hex": "#C9B99A", "name": "Sand"},
  {"hex": "#8B7355", "name": "Taupe"},
  {"hex": "#F5F0E8", "name": "Cream"}
]

Rules:
- Colors should be harmonious and suitable for home interior
- Include a mix of light and dark tones
- NO explanation, NO markdown, NO extra text
- Pure JSON array only`;

const AI_USER_PROMPT_TEMPLATE = `Generate a home decoration color palette with these parameters:
- Region/Style: {region}
- Room Type: {room}
- Decor Style: {style}

Requirements:
- 5 hex colors with names
- Harmonious and modern palette
- Suitable for residential interior
- Output only JSON array`;

// ============================================
// AI配色生成函数
// ============================================
/**
 * 调用AI生成配色方案
 * @param {string} region - 地区风格
 * @param {string} room - 房间类型
 * @param {string} style - 装修风格
 * @returns {Promise<Array>} - 5组HEX色值和颜色名称
 */
async function generatePaletteWithAI(region, room, style) {
  const userPrompt = AI_USER_PROMPT_TEMPLATE
    .replace('{region}', region)
    .replace('{room}', room)
    .replace('{style}', style);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

  try {
    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty AI response');
    }

    // 解析JSON响应
    let colors = JSON.parse(content);

    // 验证格式
    if (!Array.isArray(colors) || colors.length !== 5) {
      throw new Error('Invalid color format from AI');
    }

    // 标准化输出格式
    return colors.map(c => ({
      hex: c.hex?.toUpperCase() || c.Hex?.toUpperCase(),
      name: c.name || c.Name || 'Color'
    }));

  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ============================================
// 数据初始化函数
// ============================================
function filterLanguages(locales) {
  const filtered = {};
  ALLOWED_LANGUAGES.forEach(lang => {
    if (locales[lang]) {
      filtered[lang] = locales[lang];
    }
  });
  delete filtered['zh-CN'];
  delete filtered['zh'];
  delete filtered['de'];
  delete filtered['fr'];
  delete filtered['es'];
  return filtered;
}

function initStorage() {
  if (!fs.existsSync(STORAGE_DIR))
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_DIR))
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  if (!fs.existsSync(VERSION_FILE)) {
    fs.writeFileSync(VERSION_FILE, JSON.stringify({
      version: '1.0.0',
      timestamp: Date.now(),
      changelog: ['Initial version']
    }, null, 2));
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(AI_LOG_FILE)) {
    fs.writeFileSync(AI_LOG_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SYNC_CONFIG_FILE)) {
    fs.writeFileSync(SYNC_CONFIG_FILE, JSON.stringify({
      autoPollingEnabled: true,
      pollInterval: 24 * 60 * 60 * 1000,
      syncMode: 'incremental',
      forceRefreshOnMajorUpdate: true,
      majorVersionThreshold: 1
    }, null, 2));
  }
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify({
      totalSyncRequests: 0,
      todaySyncRequests: 0,
      last24Hours: [],
      versionRequests: {},
      aiRequests: 0,
      lastReset: Date.now()
    }, null, 2));
  }

  const defaultLocales = {};
  ALLOWED_LANGUAGES.forEach(lang => {
    defaultLocales[lang] = {};
  });

  const contentFiles = ['palettes.json', 'locales.json', 'regionParams.json', 'seo.json', 'siteConfig.json'];
  const defaultContent = {
    palettes: [],
    locales: defaultLocales,
    regionParams: {
      west: { name: 'Western Style', hueRanges: [[0, 40], [180, 230], [30, 60]], saturation: [0.18, 0.35], lightness: [0.72, 0.92] },
      sea: { name: 'Southeast Asian', hueRanges: [[15, 45], [150, 180], [180, 200]], saturation: [0.45, 0.75], lightness: [0.68, 0.90] },
      jpkr: { name: 'Japanese/Korean', hueRanges: [[30, 50], [200, 230], [100, 140]], saturation: [0.25, 0.55], lightness: [0.70, 0.93] }
    },
    seo: { title: 'Home Color Palette Generator', description: 'Create perfect color palettes for your home', keywords: 'home color, palette, decoration' },
    siteConfig: { welcomeTitle: 'Home Palette', welcomeDesc: 'Discover perfect color palettes for your home', footerText: 'palettes available' }
  };

  contentFiles.forEach(filename => {
    const filePath = path.join(CONTENT_DIR, filename);
    if (!fs.existsSync(filePath)) {
      const key = filename.replace('.json', '');
      fs.writeFileSync(filePath, JSON.stringify(defaultContent[key] || {}, null, 2));
    }
  });
}

initStorage();

// ============================================
// 读写存储文件函数
// ============================================
function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
}

function writeVersion(data) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2));
}

function readContent(filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeContent(filename, data) {
  if (filename === 'locales.json') {
    data = filterLanguages(data);
  }
  fs.writeFileSync(path.join(CONTENT_DIR, filename), JSON.stringify(data, null, 2));
}

function readSyncConfig() {
  return JSON.parse(fs.readFileSync(SYNC_CONFIG_FILE, 'utf-8'));
}

function writeSyncConfig(data) {
  fs.writeFileSync(SYNC_CONFIG_FILE, JSON.stringify(data, null, 2));
}

function readStats() {
  return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
}

function writeStats(data) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
}

function logUpdate(action, details = '') {
  const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  logs.unshift({
    id: Date.now().toString(),
    timestamp: Date.now(),
    action,
    details
  });
  if (logs.length > 100) logs.pop();
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function incrementStats(type = 'sync') {
  const stats = readStats();
  stats.totalSyncRequests++;

  const now = Date.now();
  stats.todaySyncRequests++;

  const hour = Math.floor(now / (60 * 60 * 1000));
  const hourBucket = hour - (hour % 1);
  const existing = stats.last24Hours.find(s => s.hour === hourBucket);
  if (existing) {
    existing.count++;
  } else {
    stats.last24Hours.push({ hour: hourBucket, count: 1 });
  }

  stats.last24Hours = stats.last24Hours.filter(s => now - s.hour * 3600000 < 24 * 3600000);

  const version = readVersion().version;
  stats.versionRequests[version] = (stats.versionRequests[version] || 0) + 1;

  writeStats(stats);
}

function bumpVersion(changelog) {
  const version = readVersion();
  const parts = version.version.split('.');
  parts[2] = String(Number(parts[2]) + 1);
  const newVersion = parts.join('.');
  version.version = newVersion;
  version.timestamp = Date.now();
  version.changelog = [changelog, ...version.changelog.slice(0, 9)];
  writeVersion(version);
  logUpdate('version_bump', `v${newVersion}: ${changelog}`);
  return version;
}

// ============================================
// 获取客户端真实IP
// ============================================
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.ip ||
         'unknown';
}

// ============================================
// API路由定义
// ============================================

// ----------------------------------------
// AI配色生成接口
// ----------------------------------------
/**
 * POST /api/ai/generate-palette
 * 生成AI配色方案
 *
 * 请求体：
 * {
 *   "region": "western" | "southeast" | "japanese",
 *   "room": "living" | "bedroom" | "kitchen" | "bathroom",
 *   "style": "modern" | "classic" | "minimalist" | "cozy"
 * }
 *
 * 响应：
 * {
 *   "success": true,
 *   "data": [
 *     { "hex": "#E8DED1", "name": "Warm Beige" },
 *     ...
 *   ],
 *   "fallback": false,
 *   "requestId": "xxx"
 * }
 */
app.post('/api/ai/generate-palette', async (req, res) => {
  const clientIP = getClientIP(req);
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 获取用户ID（如果已登录）
  const user = getUserFromRequest(req);
  const userId = user?.userId || null;

  // 1. 每日生成次数限制检查
  const dailyLimit = checkDailyLimit(userId, clientIP);
  if (dailyLimit.remaining <= 0 && !dailyLimit.isPremium) {
    return res.status(429).json({
      success: false,
      error: 'daily_limit_exceeded',
      message: 'Daily free generation limit reached. Please login or try again tomorrow.',
      limit: dailyLimit.limit,
      used: dailyLimit.used,
      remaining: 0
    });
  }

  // 2. IP风控检查
  const rateCheck = checkRateLimit(clientIP);
  if (!rateCheck.allowed) {
    logAICall({
      requestId,
      ip: clientIP,
      status: 'rate_limited',
      remaining: 0,
      resetIn: rateCheck.resetIn
    });

    return res.status(429).json({
      success: false,
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
      resetIn: rateCheck.resetIn,
      remaining: 0
    });
  }

  // 3. 验证请求参数
  const { region, room, style } = req.body;

  if (!region || !room || !style) {
    return res.status(400).json({
      success: false,
      error: 'missing_parameters',
      message: 'Missing required parameters: region, room, style'
    });
  }

  // 4. 记录AI请求
  const stats = readStats();
  stats.aiRequests = (stats.aiRequests || 0) + 1;
  writeStats(stats);

  // 5. 记录每日使用次数
  recordDailyUsage(userId, clientIP);

  console.log(`[AI] Request ${requestId} from ${clientIP}: region=${region}, room=${room}, style=${style}`);

  // 6. 调用AI生成配色
  try {
    const colors = await generatePaletteWithAI(region, room, style);

    // 记录成功日志
    logAICall({
      requestId,
      ip: clientIP,
      region,
      room,
      style,
      status: 'success',
      responseTime: Date.now(),
      remaining: rateCheck.remaining
    });

    // 记录AI成功统计
    recordAIRequest('success');

    res.json({
      success: true,
      data: colors,
      fallback: false,
      requestId
    });

  } catch (err) {
    console.error(`[AI] Request ${requestId} failed:`, err.message);

    // 记录失败日志
    logAICall({
      requestId,
      ip: clientIP,
      region,
      room,
      style,
      status: 'error',
      error: err.message,
      fallback: true,
      remaining: rateCheck.remaining
    });

    // 返回备用配色
    const fallbackColors = getRandomFallbackPalette();

    // 记录AI降级统计
    recordAIRequest('fallback');

    res.json({
      success: true,
      data: fallbackColors,
      fallback: true,
      requestId,
      message: 'AI service unavailable, using fallback palette'
    });
  }
});

// ----------------------------------------
// AI配置查询接口（仅开发环境）
// ----------------------------------------
app.get('/api/ai/config', (req, res) => {
  const isDev = process.env.NODE_ENV !== 'prod';

  res.json({
    configured: !!(AI_CONFIG.apiKey && AI_CONFIG.baseUrl),
    model: AI_CONFIG.model,
    timeout: AI_CONFIG.timeout,
    rateLimit: {
      maxPerMinute: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW
    },
    // 仅开发环境返回详细配置
    ...(isDev && {
      baseUrl: AI_CONFIG.baseUrl,
      model: AI_CONFIG.model,
      apiKeyMasked: AI_CONFIG.apiKey ? '***' + AI_CONFIG.apiKey.slice(-4) : 'NOT SET'
    })
  });
});

// ----------------------------------------
// AI装修建议接口
// ----------------------------------------
const DECOR_ADVICE_PROMPT = `You are a professional interior design consultant.
Based on the color palette and room information, provide specific decor advice.
Output ONLY the advice text, no JSON, no markdown, no extra formatting.
Keep the advice practical and actionable (2-3 sentences).
Language: respond in the same language as the user's request.`;

app.post('/api/ai/decor-advice', async (req, res) => {
  const { paletteName, colors, room, style, language } = req.body;
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (!colors || !room || !style) {
    return res.status(400).json({
      success: false,
      error: 'missing_parameters',
      message: 'Missing required parameters'
    });
  }

  const colorList = colors.map(c => `${c.hex} (${c.name || c.role})`).join(', ');
  const userPrompt = `Color palette: ${paletteName || 'Custom Palette'}
Colors: ${colorList}
Room: ${room}
Style: ${style}
Language: ${language || 'en'}

Provide decor advice for this color scheme.`;

  try {
    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: DECOR_ADVICE_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content?.trim();

    if (!advice) {
      throw new Error('Empty AI response');
    }

    res.json({
      success: true,
      advice,
      requestId
    });

  } catch (err) {
    console.error(`[AI Decor Advice] Request ${requestId} failed:`, err.message);
    res.json({
      success: false,
      error: err.message,
      requestId
    });
  }
});

// ----------------------------------------
// 版本相关接口
// ----------------------------------------
app.get('/api/version', (req, res) => {
  incrementStats('version_check');
  res.json(readVersion());
});

app.get('/api/version/compare', (req, res) => {
  const { clientVersion } = req.query;
  const serverVersion = readVersion();
  const config = readSyncConfig();

  let shouldUpdate = false;
  let updateType = 'none';

  if (clientVersion !== serverVersion.version) {
    shouldUpdate = true;

    const clientParts = clientVersion.split('.').map(Number);
    const serverParts = serverVersion.version.split('.').map(Number);

    if (serverParts[0] > clientParts[0]) {
      updateType = 'major';
    } else if (serverParts[1] > clientParts[1]) {
      updateType = 'minor';
    } else {
      updateType = 'patch';
    }
  }

  res.json({
    serverVersion: serverVersion.version,
    clientVersion,
    shouldUpdate,
    updateType,
    forceRefresh: config.forceRefreshOnMajorUpdate && updateType === 'major',
    syncMode: config.syncMode,
    timestamp: serverVersion.timestamp
  });
});

app.post('/api/version/bump', (req, res) => {
  const { changelog } = req.body;
  const version = bumpVersion(changelog || 'Manual version bump');
  res.json({ success: true, version });
});

// ----------------------------------------
// 资源内容接口
// ----------------------------------------
app.get('/api/content/incremental', (req, res) => {
  const { lastModified } = req.query;
  const clientTime = parseInt(lastModified) || 0;

  const contentTypes = ['palettes', 'locales', 'regionParams', 'seo', 'siteConfig'];
  const updates = {};
  let hasUpdates = false;

  contentTypes.forEach(type => {
    const filePath = path.join(CONTENT_DIR, `${type}.json`);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.mtime.getTime() > clientTime) {
        let data = readContent(`${type}.json`);
        if (type === 'locales') {
          data = filterLanguages(data);
        }
        updates[type] = data;
        hasUpdates = true;
      }
    }
  });

  incrementStats('incremental');
  res.json({
    hasUpdates,
    updates,
    serverTimestamp: Date.now()
  });
});

app.get('/api/content/:type', (req, res) => {
  const { type } = req.params;
  const allowedTypes = ['palettes', 'locales', 'regionParams', 'seo', 'siteConfig'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  let data = readContent(`${type}.json`);
  if (type === 'locales') {
    data = filterLanguages(data);
  }
  incrementStats('content');
  res.json(data);
});

app.get('/api/content', (req, res) => {
  const locales = filterLanguages(readContent('locales.json'));
  const content = {
    palettes: readContent('palettes.json'),
    locales: locales,
    regionParams: readContent('regionParams.json'),
    seo: readContent('seo.json'),
    siteConfig: readContent('siteConfig.json')
  };
  incrementStats('full_content');
  res.json(content);
});

app.post('/api/content/:type', (req, res) => {
  const { type } = req.params;
  const { data, changelog } = req.body;
  const allowedTypes = ['palettes', 'locales', 'regionParams', 'seo', 'siteConfig'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  writeContent(`${type}.json`, data);
  const version = bumpVersion(changelog || `Updated ${type}`);
  res.json({ success: true, version });
});

app.post('/api/batch-update', (req, res) => {
  const { palettes, locales, regionParams, seo, siteConfig, changelog } = req.body;
  if (palettes) writeContent('palettes.json', palettes);
  if (locales) writeContent('locales.json', locales);
  if (regionParams) writeContent('regionParams.json', regionParams);
  if (seo) writeContent('seo.json', seo);
  if (siteConfig) writeContent('siteConfig.json', siteConfig);
  const version = bumpVersion(changelog || 'Batch update');
  res.json({ success: true, version });
});

// ----------------------------------------
// 回滚接口
// ----------------------------------------
app.post('/api/rollback', (req, res) => {
  const { version, changelog } = req.body;
  if (!version) {
    return res.status(400).json({ error: 'Version required' });
  }
  const currentVersion = readVersion();
  currentVersion.version = version;
  currentVersion.timestamp = Date.now();
  currentVersion.changelog = [changelog || `Rollback to ${version}`, ...currentVersion.changelog.slice(0, 9)];
  writeVersion(currentVersion);
  logUpdate('rollback', `Rolled back to ${version}`);
  res.json({ success: true, version: currentVersion });
});

// ----------------------------------------
// 日志接口
// ----------------------------------------
app.get('/api/logs', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')));
});

app.get('/api/ai/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = JSON.parse(fs.readFileSync(AI_LOG_FILE, 'utf-8'));
  res.json(logs.slice(0, limit));
});

// ----------------------------------------
// 同步配置接口
// ----------------------------------------
app.get('/api/sync/config', (req, res) => {
  res.json(readSyncConfig());
});

app.post('/api/sync/config', (req, res) => {
  const config = req.body;
  writeSyncConfig(config);
  logUpdate('config_update', `同步配置已更新: ${JSON.stringify(config)}`);
  res.json({ success: true, config });
});

// ----------------------------------------
// 统计接口
// ----------------------------------------
app.get('/api/sync/stats', (req, res) => {
  const stats = readStats();
  // 计算当前风控状态
  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP);

  res.json({
    ...stats,
    rateLimit: {
      remaining: rateCheck.remaining,
      resetIn: rateCheck.resetIn
    }
  });
});

app.post('/api/sync/stats/reset', (req, res) => {
  const stats = {
    totalSyncRequests: 0,
    todaySyncRequests: 0,
    last24Hours: [],
    versionRequests: {},
    aiRequests: 0,
    lastReset: Date.now()
  };
  writeStats(stats);
  logUpdate('stats_reset', '同步统计数据已重置');
  res.json({ success: true });
});

// ----------------------------------------
// 缓存管理接口
// ----------------------------------------
app.post('/api/cache/clear', (req, res) => {
  const version = readVersion();
  const parts = version.version.split('.');
  parts[1] = String(Number(parts[1]) + 1);
  const newVersion = parts.join('.');
  version.version = newVersion;
  version.timestamp = Date.now();
  version.changelog = ['Cache cleared - forced full refresh', ...version.changelog.slice(0, 9)];
  writeVersion(version);
  logUpdate('cache_clear', `缓存已清空，版本升级至 ${newVersion}`);
  res.json({ success: true, version: newVersion });
});

// ============================================
// 用户认证接口（第二阶段已实现）
// ============================================

/**
 * 用户注册接口（暂时禁用：个人用户无法获得 Google OAuth 授权，
 * 注册通道同步关闭。启用时将下面一行注释掉即可。）
 * POST /api/auth/register
 */
app.post('/api/auth/register', (req, res) => {
  res.status(503).json({
    success: false,
    error: 'registration_disabled',
    message: 'Registration is temporarily unavailable. Please login with an existing account.'
  });
});

/**
 * 用户登录接口
 * POST /api/auth/login
 */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const result = loginUser(username, password);

  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const favoritesCount = getFavoritesCount(req.user.userId);
  res.json({
    success: true,
    data: {
      id: req.user.userId,
      username: req.user.username,
      favoritesCount
    }
  });
});

/**
 * 验证Token有效性
 * GET /api/auth/verify
 */
app.get('/api/auth/verify', (req, res) => {
  const user = getUserFromRequest(req);
  if (user) {
    res.json({
      valid: true,
      user: {
        id: user.userId,
        username: user.username
      }
    });
  } else {
    res.json({
      valid: false
    });
  }
});

/**
 * Google OAuth2 登录（暂时禁用：个人用户无法完成 Google Cloud Console 的
 * OAuth 生产环境验证。启用时将下面一段 body 替换为原始实现即可。）
 * POST /api/auth/google
 * 请求体：{ credential: "Google ID Token" }
 */
app.post('/api/auth/google', async (req, res) => {
  res.status(503).json({
    success: false,
    error: 'google_auth_disabled',
    message: 'Google Sign-In is temporarily unavailable. Please login with username and password.'
  });
});

// ============================================
// 收藏管理接口（第二阶段已实现）
// ============================================

/**
 * 获取用户收藏列表
 * GET /api/favorites
 */
app.get('/api/favorites', authMiddleware, (req, res) => {
  const favorites = getFavorites(req.user.userId);
  res.json({
    success: true,
    data: favorites
  });
});

/**
 * 添加收藏
 * POST /api/favorites
 */
app.post('/api/favorites', authMiddleware, (req, res) => {
  const { palette_name, color_data } = req.body;
  const result = addFavorite(req.user.userId, palette_name, color_data);

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

/**
 * 更新收藏名称
 * PUT /api/favorites/:id
 */
app.put('/api/favorites/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { palette_name } = req.body;
  const result = updateFavoriteName(req.user.userId, parseInt(id), palette_name);

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

/**
 * 删除收藏
 * DELETE /api/favorites/:id
 */
app.delete('/api/favorites/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const result = deleteFavorite(req.user.userId, parseInt(id));

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// ============================================
// 统计接口（第二阶段已实现）
// ============================================

/**
 * 获取统计概览
 * GET /api/stats/overview
 */
app.get('/api/stats/overview', (req, res) => {
  const stats = getStatsOverview();
  res.json({
    success: true,
    data: stats
  });
});

/**
 * 获取AI使用统计
 * GET /api/stats/ai-usage
 */
app.get('/api/stats/ai-usage', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const stats = getAIUsageStats(days);
  res.json({
    success: true,
    data: stats
  });
});

/**
 * 获取访问统计
 * GET /api/stats/visits
 */
app.get('/api/stats/visits', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = getVisitStats(days);
  res.json({
    success: true,
    data: stats
  });
});

/**
 * 获取用户/IP剩余生成次数
 * GET /api/ai/remaining
 */
app.get('/api/ai/remaining', (req, res) => {
  const clientIP = getClientIP(req);
  const user = getUserFromRequest(req);
  const userId = user?.userId || null;

  const dailyLimit = checkDailyLimit(userId, clientIP);

  res.json({
    success: true,
    data: {
      remaining: dailyLimit.remaining,
      limit: dailyLimit.limit,
      used: dailyLimit.used,
      isPremium: dailyLimit.isPremium
    }
  });
});

// ============================================
// 静态文件服务（管理后台）
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dist', 'index.html'));
});

// ============================================
// 服务启动
// ============================================
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🌐 Node_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Server running on http://localhost:${PORT}`);
  console.log(`📦 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🌍 CORS origin: ${ALLOW_ORIGIN}`);
  console.log(`🔒 Language isolation: Only ${ALLOWED_LANGUAGES.join('/')} allowed`);
  console.log('----------------------------------------');
  console.log(`🤖 AI Config:`);
  console.log(`   Base URL: ${AI_CONFIG.baseUrl}`);
  console.log(`   Model: ${AI_CONFIG.model}`);
  console.log(`   Timeout: ${AI_CONFIG.timeout}ms`);
  console.log(`   API Key: ${AI_CONFIG.apiKey ? '***' + AI_CONFIG.apiKey.slice(-4) : 'NOT SET'}`);
  console.log(`   Rate Limit: ${RATE_LIMIT_MAX} requests/minute per IP`);
  console.log('========================================');
});
