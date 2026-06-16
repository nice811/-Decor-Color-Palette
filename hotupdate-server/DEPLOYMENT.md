# 热更新管理后台部署指南

## 目录结构

```
hotupdate-server/
├── server.js              # Node.js Express 服务器
├── package.json           # 服务器依赖配置
├── admin/                 # React 管理后台
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── hooks/useApi.js
│       └── components/
├── storage/               # JSON 文件存储（自动创建）
│   ├── version.json
│   ├── update-log.json
│   └── content/
│       ├── palettes.json
│       ├── locales.json
│       ├── regionParams.json
│       ├── seo.json
│       └── siteConfig.json
├── client-sdk.js          # 前端同步 SDK
└── DEPLOYMENT.md          # 部署文档
```

## 服务器部署

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地开发

```bash
# 进入服务器目录
cd hotupdate-server

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

服务器运行在 `http://localhost:3001`

### 生产部署

#### 方式一：PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 启动服务器
pm2 start server.js --name hotupdate

# 设置开机自启
pm2 startup
pm2 save
```

#### 方式二：Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t hotupdate-server .

# 运行容器
docker run -p 3001:3001 -v $(pwd)/storage:/app/storage hotupdate-server
```

#### 方式三：Vercel / Netlify（不推荐）

由于需要文件存储，不建议部署到无状态平台。如需部署，需配置外部存储（如 AWS S3）。

### 环境变量

```bash
PORT=3001                    # 服务端口
NODE_ENV=production          # 生产环境
```

## 管理后台构建

```bash
cd hotupdate-server/admin

# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建产物位于 admin/dist/
```

构建完成后，服务器会自动 Serve `admin/dist` 目录。

## 前端接入指南

### 安装 SDK

将 `client-sdk.js` 复制到前端项目中，或通过 HTTP 引入：

```html
<script type="module" src="http://your-server:3001/client-sdk.js"></script>
```

### 使用示例

```javascript
import { HotUpdateClient } from './client-sdk.js';

// 初始化客户端
const hotupdate = new HotUpdateClient({
  baseUrl: 'http://your-server:3001',
  pollInterval: 24 * 60 * 60 * 1000, // 24小时轮询
  onUpdate: (data) => {
    console.log('Content updated:', data.version);
    // 更新应用状态
    updateApp(data);
  },
  onError: (type, error) => {
    console.error('Hot update error:', type, error);
  },
});

// 初始化时检查更新
async function initApp() {
  const data = await hotupdate.initialize();
  
  if (data) {
    // 使用缓存数据初始化应用
    setupPalettes(data.palettes);
    setupLocales(data.locales);
    setupRegionParams(data.regionParams);
    setupSeo(data.seo);
    setupSiteConfig(data.siteConfig);
  }
  
  // 启动自动轮询
  hotupdate.startAutoPolling();
}

// 手动触发检查
document.getElementById('refresh-btn').addEventListener('click', () => {
  hotupdate.checkForUpdate();
});
```

### 与 React 集成

```javascript
import { useEffect, useState } from 'react';
import { HotUpdateClient } from './client-sdk';

const hotupdate = new HotUpdateClient({
  baseUrl: 'http://your-server:3001',
});

function App() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const init = async () => {
      const data = await hotupdate.initialize();
      if (data) setContent(data);
    };
    init();

    const handleUpdate = (data) => {
      setContent(data);
    };

    hotupdate.onUpdate = handleUpdate;
    hotupdate.startAutoPolling();

    return () => {
      hotupdate.stopAutoPolling();
    };
  }, []);

  if (!content) return <Loading />;

  return (
    <div>
      <PaletteList palettes={content.palettes} />
      <LocaleProvider locales={content.locales} />
    </div>
  );
}
```

## API 接口说明

### GET /api/version
获取当前版本信息

**响应**:
```json
{
  "version": "1.0.5",
  "timestamp": 1699999999999,
  "changelog": ["Updated color palettes", "Fixed locale translations"]
}
```

### GET /api/content/:type
获取指定类型的内容

**参数**:
- `type`: palettes | locales | regionParams | seo | siteConfig

### GET /api/content
获取所有内容

**响应**:
```json
{
  "palettes": [...],
  "locales": {...},
  "regionParams": {...},
  "seo": {...},
  "siteConfig": {...}
}
```

### POST /api/content/:type
更新指定类型的内容

**请求体**:
```json
{
  "data": {...},
  "changelog": "Update description"
}
```

### POST /api/batch-update
批量更新多个内容类型

**请求体**:
```json
{
  "palettes": [...],
  "locales": {...},
  "regionParams": {...},
  "seo": {...},
  "siteConfig": {...},
  "changelog": "Batch update"
}
```

### POST /api/rollback
版本回滚

**请求体**:
```json
{
  "version": "1.0.3",
  "changelog": "Rollback reason"
}
```

### GET /api/logs
获取更新日志

## 安全建议

1. **限制访问**：在生产环境中，建议通过 Nginx 配置基本认证或 IP 白名单
2. **HTTPS**：确保部署在 HTTPS 环境下，避免中间人攻击
3. **CORS**：根据需要配置 `Access-Control-Allow-Origin`
4. **备份**：定期备份 `storage/` 目录

## Nginx 配置示例

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # 可选：基本认证
  location /admin {
    auth_basic "Admin Panel";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3001/admin;
  }
}
```

## 故障排查

### 常见问题

1. **服务器启动失败**
   - 检查端口是否被占用
   - 检查 Node.js 版本
   - 检查依赖是否安装完整

2. **管理后台无法访问**
   - 确认已执行 `npm run build`
   - 检查 `admin/dist` 目录是否存在

3. **前端无法获取更新**
   - 检查服务器地址是否正确
   - 检查 CORS 配置
   - 检查网络连接

4. **数据不持久化**
   - 检查 `storage/` 目录权限
   - 确保进程有写入权限
