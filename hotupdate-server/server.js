import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_LANGUAGES = ['en', 'de', 'fr', 'es', 'it'];

// CORS配置：从环境变量读取允许的前端域名
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
app.use(cors({
  origin: ALLOW_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'admin', 'dist')));

const STORAGE_DIR = path.join(__dirname, 'storage');
const VERSION_FILE = path.join(STORAGE_DIR, 'version.json');
const CONTENT_DIR = path.join(STORAGE_DIR, 'content');
const LOG_FILE = path.join(STORAGE_DIR, 'update-log.json');
const SYNC_CONFIG_FILE = path.join(STORAGE_DIR, 'sync-config.json');
const STATS_FILE = path.join(STORAGE_DIR, 'sync-stats.json');

function filterLanguages(locales) {
  const filtered = {};
  ALLOWED_LANGUAGES.forEach(lang => {
    if (locales[lang]) {
      filtered[lang] = locales[lang];
    }
  });
  delete filtered['zh-CN'];
  delete filtered['zh'];
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
      west: { hueRanges: [[0, 40], [180, 230], [30, 60]], saturation: [0.18, 0.35], lightness: [0.72, 0.92], accentHueRanges: [[15, 35], [195, 215], [0, 10]], neutralLightness: [0.75, 0.92] },
      sea: { hueRanges: [[15, 45], [150, 180], [180, 200]], saturation: [0.45, 0.75], lightness: [0.68, 0.90], accentHueRanges: [[15, 30], [330, 350], [45, 60]], neutralLightness: [0.78, 0.92] },
      jpkr: { hueRanges: [[30, 50], [200, 230], [100, 140]], saturation: [0.25, 0.55], lightness: [0.70, 0.93], accentHueRanges: [[340, 360], [200, 230], [45, 55]], neutralLightness: [0.78, 0.94] }
    },
    seo: { title: 'Decor Color Palette – Free Home Color Scheme Generator', description: 'Discover perfect color palettes for home decoration.', keywords: 'home color palette, color scheme generator', ogTitle: '', ogDescription: '', faq: [] },
    siteConfig: { welcomeTitle: 'Decor Color Palette', welcomeDesc: 'Discover perfect color palettes for your home decoration', footerText: 'curated palettes available' }
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
  const today = new Date(now).toDateString();
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

app.post('/api/version/bump', (req, res) => {
  const { changelog } = req.body;
  const version = bumpVersion(changelog || 'Manual version bump');
  res.json({ success: true, version });
});

app.get('/api/logs', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')));
});

app.get('/api/sync/config', (req, res) => {
  res.json(readSyncConfig());
});

app.post('/api/sync/config', (req, res) => {
  const config = req.body;
  writeSyncConfig(config);
  logUpdate('config_update', `同步配置已更新: ${JSON.stringify(config)}`);
  res.json({ success: true, config });
});

app.get('/api/sync/stats', (req, res) => {
  res.json(readStats());
});

app.post('/api/sync/stats/reset', (req, res) => {
  const stats = {
    totalSyncRequests: 0,
    todaySyncRequests: 0,
    last24Hours: [],
    versionRequests: {},
    lastReset: Date.now()
  };
  writeStats(stats);
  logUpdate('stats_reset', '同步统计数据已重置');
  res.json({ success: true });
});

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🌐 Node_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Server running on http://localhost:${PORT}`);
  console.log(`📦 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🌍 CORS origin: ${ALLOW_ORIGIN}`);
  console.log(`🔒 Language isolation: Only ${ALLOWED_LANGUAGES.join('/')} allowed (NO Chinese)`);
  console.log('========================================');
});
