# 海外装修配色工具站 - 生产部署完整指南

## 📋 部署清单概览

| 序号 | 任务 | 状态 |
|------|------|------|
| 1 | 前端生产打包（自动删除中文资源） | ✅ 已完成 |
| 2 | 后端服务环境配置 | ✅ 已完成 |
| 3 | PM2进程守护配置 | ✅ 已完成 |
| 4 | 跨域CORS配置 | ✅ 已完成 |
| 5 | 前端热更新SDK集成 | ✅ 已完成 |

---

## 🎯 一、项目结构

```
decor-color-tool/
├── dist/                          # 前端生产打包产物（部署至Vercel）
│   ├── index.html
│   ├── assets/
│   ├── locales/                   # 仅含 en/de/fr/es/it，无中文
│   └── ...
├── hotupdate-server/              # 中文管理后台 + Node后端API
│   ├── server.js                  # 后端服务入口
│   ├── admin/                     # 中文管理后台前端
│   │   └── dist/                 # 已构建的管理后台产物
│   ├── storage/                   # 云端资源JSON持久化
│   │   ├── content/              # 配色/翻译/SEO/参数配置
│   │   ├── version.json          # 版本号管理
│   │   ├── sync-config.json      # 同步规则配置
│   │   ├── sync-stats.json       # 访问统计
│   │   └── update-log.json       # 更新日志
│   ├── .env                      # 生产环境变量
│   ├── pm2.config.js             # PM2进程守护配置
│   └── package.json
├── scripts/
│   └── clean-cn.js               # 生产打包自动删除中文脚本
├── .env.production               # 前端生产环境变量
└── .env.development              # 前端开发环境变量
```

---

## 🌐 二、域名规划

| 服务 | 域名 | 说明 |
|------|------|------|
| 前端站点 | `https://decorcolortool.com` | Vercel/Cloudflare Pages托管 |
| API服务 | `https://api.decorcolortool.com` | Nginx反向代理至3001 |
| 管理后台 | `https://admin.decorcolortool.com` | Nginx反向代理至3001 |

---

## 🚀 三、部署执行流程

### 3.1 前端站点部署（Vercel）

#### 步骤1：配置环境变量
`.env.production`（本地开发时使用）
```env
VITE_DEV_DEBUG_LANG=false
VITE_SITE_DOMAIN=https://decorcolortool.com
VITE_BACKEND_API=https://api.decorcolortool.com
```

#### 步骤2：生产打包
```bash
cd decor-color-tool
npm ci
npm run build:prod
```
**自动执行逻辑：**
1. 读取生产环境变量
2. Vite生产模式构建
3. 运行 `scripts/clean-cn.js` 自动删除 `public/locales/zh-CN`
4. 验证打包产物仅含 `en/de/fr/es/it` 五国外语

#### 步骤3：本地预览校验
```bash
npm run preview
```
访问 `http://localhost:4173` 验证：
- [ ] 语言选择器仅显示 en/de/fr/es/it
- [ ] `?lang=zh-CN` 自动跳转英文
- [ ] `/locales/zh-CN/common.json` 返回404

#### 步骤4：Vercel部署
1. GitHub推送代码
2. Vercel导入仓库
3. 配置构建：
   - Framework: Vite
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
4. 添加环境变量：
   ```
   VITE_DEV_DEBUG_LANG=false
   VITE_SITE_DOMAIN=https://decorcolortool.com
   VITE_BACKEND_API=https://api.decorcolortool.com
   ```
5. Deploy完成

---

### 3.2 后端服务部署（服务器）

#### 步骤1：上传项目文件
```bash
scp -r hotupdate-server root@your-server:/opt/color-admin-server/
```

#### 步骤2：配置生产环境变量
在服务器 `/opt/color-admin-server/.env` 中配置：
```env
NODE_ENV=prod
PORT=3001
ALLOW_ORIGIN=https://decorcolortool.com
ADMIN_FRONT_URL=https://admin.decorcolortool.com
# AI配置（如已部署OneAPI）
ONE_API_BASE_URL=http://127.0.0.1:3000/v1
ONE_API_TOKEN=sk-your-one-api-token
AI_MODEL_PROD=gemini-2.5-flash
AI_MODEL_DEV=qwen-max
```

#### 步骤3：安装依赖
```bash
cd /opt/color-admin-server
npm ci --only=production
```

#### 步骤4：PM2启动服务
```bash
pm2 start pm2.config.js
pm2 save
pm2 startup
```

#### 步骤5：验证服务
```bash
curl http://localhost:3001/api/version
# 应返回：{"version":"1.0.2","timestamp":...}
```

---

### 3.3 Nginx反向代理配置

```nginx
# /etc/nginx/sites-available/api.decorcolortool.com
server {
    listen 80;
    server_name api.decorcolortool.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.decorcolortool.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# /etc/nginx/sites-available/admin.decorcolortool.com
server {
    listen 80;
    server_name admin.decorcolortool.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.decorcolortool.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/api.decorcolortool.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/admin.decorcolortool.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## ✅ 四、部署后验证清单

### 前端站点验证
| 检查项 | 验证方法 | 预期结果 |
|--------|----------|----------|
| 无中文入口 | 语言选择器 | 仅 en/de/fr/es/it |
| 中文参数跳转 | `?lang=zh-CN` | 302跳转 `/en` |
| 中文资源删除 | `/locales/zh-CN/` | 404 |
| 热更新初始化 | 控制台Network | 请求 `api/version` |
| 配色生成 | 点击生成按钮 | 正常生成色卡 |
| 收藏功能 | 点击❤️收藏 | localStorage存储 |
| 区域切换 | 切换区域 | 重新生成配色 |

### 后端服务验证
| 检查项 | 验证方法 | 预期结果 |
|--------|----------|----------|
| 版本接口 | `curl http://localhost:3001/api/version` | JSON版本信息 |
| 管理后台 | `http://localhost:3001/` | 中文界面 |
| 跨域配置 | 前端请求API | 无CORS错误 |
| 日志记录 | `GET /api/logs` | 更新日志列表 |
| 统计数据 | `GET /api/sync/stats` | 访问统计JSON |

---

## 🔄 五、热更新运维

### 5.1 日常内容更新
1. 登录 `https://admin.decorcolortool.com`
2. 修改配色库/翻译文案/SEO配置
3. 点击【保存发布】→ 自动升级版本号
4. 已上线用户下次访问自动拉取更新

### 5.2 版本回退
1. 进入【版本同步中心】
2. 输入目标版本号
3. 填写回退原因
4. 确认回退 → 全网自动同步旧资源

### 5.3 强制全量更新
1. 点击【清空云端缓存】
2. 确认操作 → 强制所有用户完整拉取资源

---

## 🆘 六、故障排查

| 故障现象 | 排查命令 | 解决方案 |
|----------|----------|----------|
| 前端无法请求API | 浏览器控制台Network | 检查CORS配置/跨域Nginx |
| 热更新不生效 | localStorage检查缓存 | 手动清除浏览器缓存 |
| 后端无响应 | `pm2 status` | `pm2 restart color-admin-api` |
| 版本不更新 | `GET /api/version` | 检查版本号是否自增 |
| 中文资源残留 | 检查dist/locales目录 | 重新执行 `npm run build:prod` |

---

## 📊 七、当前系统状态

- **前端版本**：v1.2.0（打包产物已验证）
- **后端版本**：v1.0.2
- **语言隔离**：✅ 完全（仅 en/de/fr/es/it）
- **热更新SDK**：✅ 已集成
- **跨域配置**：✅ 支持指定域名
- **PM2守护**：✅ 已配置

---

**最后更新**：2026-06-16
