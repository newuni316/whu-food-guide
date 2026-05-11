# 珞珈美食指南 — WHU Food Guide

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blueviolet" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/DeepSeek-V3-0066FF" alt="DeepSeek" />
</p>

<p align="center">
  武汉大学校园美食平台 — AI 推荐 · 美食地图 · 排行榜 · 广八路美食 PK
</p>

---

## 项目简介

**武大美食指北** 是一个面向武汉大学学生的校园美食平台，帮助同学们快速发现好吃的、找到想去的餐厅。

核心功能：

- **分区浏览** — 信息学部、文理学部、工学部、医学部、广八路、银泰等商圈分类导航
- **智能搜索** — 按价格、口味、标签筛选餐厅
- **美食地图** — 校园食堂与周边餐厅分布一目了然
- **排行榜** — 今日热门、性价比之选、夜宵推荐等多种榜单
- **广八路 PK** — 趣味美食投票游戏，生成广八路美食排行榜
- **AI 助手** — 基于 RAG 的智能美食推荐（需配置 API Key）
- **管理后台** — 非技术人员也可维护商户数据

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI | TailwindCSS 4 + Framer Motion + Lucide Icons |
| 状态管理 | Zustand + TanStack React Query |
| 后端 | Next.js API Routes + Prisma 6 ORM |
| 数据库 | PostgreSQL 16 + pgvector（可选） |
| 缓存 | Redis 7（可选，自动降级） |
| 认证 | NextAuth v5 (JWT) |
| AI | DeepSeek / OpenAI API（可选） |
| 部署 | Docker / Vercel / Netlify |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/newuni316/whu-food-guide.git
cd whu-food-guide
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，必填项：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whu_food_guide"
NEXTAUTH_SECRET="运行 openssl rand -base64 32 生成"
NEXTAUTH_URL="http://localhost:3000"
```

可选项（不配置则自动降级）：

```env
REDIS_URL="redis://localhost:6379"
DEEPSEEK_API_KEY="sk-..."
OPENAI_API_KEY="sk-..."
```

### 3. 启动数据库

```bash
# 方式一：Docker（推荐）
docker compose up -d

# 方式二：使用已有的 PostgreSQL
# 确保 DATABASE_URL 指向你的数据库
```

### 4. 初始化

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. 启动

```bash
npm run dev
```

访问 http://localhost:3000

---

## 项目结构

```
whu-food-guide/
├── src/
│   ├── app/                    # 页面路由
│   │   ├── page.tsx            # 首页
│   │   ├── area/[slug]/        # 商圈页面（动态路由）
│   │   ├── explore/            # 探索搜索
│   │   ├── rankings/           # 排行榜
│   │   ├── game/               # 广八路美食 PK
│   │   ├── map/                # 美食地图
│   │   ├── ai-chat/            # AI 助手
│   │   ├── admin/              # 管理后台
│   │   └── api/                # API 路由
│   ├── components/             # UI 组件
│   │   ├── layout/             # 布局（导航、侧边栏）
│   │   ├── ui/                 # 基础 UI 组件
│   │   └── ...                 # 业务组件
│   ├── lib/                    # 工具库
│   │   ├── ai/                 # AI 模块
│   │   ├── cache/              # 缓存层
│   │   └── ...                 # 工具函数
│   ├── config/                 # 配置文件
│   │   └── areas.ts            # 商圈区域配置
│   └── types/                  # TypeScript 类型
├── data/
│   └── restaurants/            # 餐厅 JSON 数据
├── scripts/                    # 工具脚本
├── prisma/                     # 数据库模型
└── public/                     # 静态资源
```

---

## 数据结构

餐厅数据存储在 `data/restaurants/` 目录下，每个餐厅一个 JSON 文件：

```json
{
  "name": "餐厅名称",
  "slug": "url-slug",
  "campus": "wenli",
  "area": "桂园",
  "category": ["快餐", "正餐"],
  "price_range": [8, 15],
  "rating": { "taste": 4, "environment": 3, "value": 4 },
  "coordinates": { "lat": 30.54, "lng": 114.37 },
  "address": "详细地址",
  "hours": "06:30-20:00",
  "recommendations": ["招牌菜1", "招牌菜2"],
  "tags": ["性价比高", "量大实惠"],
  "source": "问卷",
  "last_verified": "2026-05-09"
}
```

新增餐厅只需在 `data/restaurants/` 目录下添加 JSON 文件，然后运行：

```bash
python3 scripts/process_data.py
```

---

## 管理后台

访问 `/admin` 进入管理后台（需要管理员账号）。

管理后台功能：
- 餐厅管理（增删改查）
- 评论审核
- 用户管理
- 数据统计

默认管理员账号在 `npm run db:seed` 时创建，详见终端输出。

> **安全提示**：请在首次登录后立即修改默认密码。

---

## 部署

### Vercel（推荐）

1. Fork 本仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署

### Docker

```bash
docker compose up -d
```

### 手动部署

```bash
npm run build
npm start
```

---

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m 'feat: add xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

### 数据贡献

发现新餐厅或信息有误？欢迎通过以下方式贡献：

- 在 `data/restaurants/` 下添加新餐厅 JSON
- 通过 GitHub Issue 提交餐厅信息
- 在管理后台直接编辑

---

## License

MIT © WHU Food Guide Team
