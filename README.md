# 珞珈美食指南 — WHU Food Guide

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blueviolet" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/pgvector-0.8-336791" alt="pgvector" />
  <img src="https://img.shields.io/badge/DeepSeek-V3-0066FF" alt="DeepSeek" />
  <img src="https://img.shields.io/badge/AI%20Native-FF6B6B" alt="AI Native" />
</p>

<p align="center">
  AI Native 智慧校园饮食助手 — 基于 RAG + 向量搜索 + 推荐系统的武汉大学全栈应用
</p>

---

## ✨ 核心特性

| 模块 | 功能 | 技术实现 |
|------|------|----------|
| **AI 智能推荐** | 自然语言查询 → 个性化菜品推荐 | RAG + pgvector + DeepSeek |
| **语义搜索** | "减脂高蛋白""20元以内" | text-embedding-3-small + 余弦相似度 |
| **情感分析** | 评论自动分析 + 口碑摘要 | LLM + 关键词提取 |
| **个性化推荐** | 用户画像 + 协同过滤 + 内容推荐 | 多维加权排序算法 |
| **实时排行榜** | 6 种排行榜 — 今日/夜宵/性价比/健身... | Redis 缓存 + 动态计算 |
| **校园美食地图** | 食堂分布 + 营业状态 + 排队指数 | Leaflet + 实时数据 |
| **用户系统** | JWT 认证 + 收藏/评价/成就 | NextAuth v5 + RBAC |
| **管理后台** | 食堂/菜品/评论/用户管理 | Admin 路由 + 权限控制 |

---

## 🏗 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)                   │
│                    SSR + ISR + Server Actions                │
├─────────────────────────────────────────────────────────────┤
│  Frontend                 │  API Layer (Route Handlers)      │
│  ├─ Landing Page          │  ├─ /api/ai/chat (RAG 对话)      │
│  ├─ Explore (语义搜索)     │  ├─ /api/ai/recommend (推荐)     │
│  ├─ Rankings (排行榜)      │  ├─ /api/search (向量搜索)       │
│  ├─ AI Chat (AI 助手)     │  ├─ /api/cafeterias (食堂)       │
│  ├─ Map (美食地图)         │  ├─ /api/rankings (排行)         │
│  ├─ Profile (个人中心)     │  └─ /api/auth/* (认证)           │
│  └─ Admin (管理后台)       │                                  │
├─────────────────────────────────────────────────────────────┤
│                    AI Pipeline                               │
│  ├─ Embedding: text-embedding-3-small (1536d)               │
│  ├─ Vector DB: pgvector (余弦相似度)                          │
│  ├─ RAG: 检索增强生成                                        │
│  ├─ Recommender: 多维加权排序                                │
│  └─ Sentiment: 评论情感分析                                  │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16 + pgvector  │  Redis 7  │  DeepSeek API      │
│  ├─ 18 数据模型             │  ├─ 排行榜 │  ├─ Chat (LLM)    │
│  ├─ 向量索引 (HNSW)        │  ├─ 缓存   │  └─ Embedding     │
│  └─ 全文搜索               │  └─ 会话   │                   │
└─────────────────────────────────────────────────────────────┘
```

### RAG 推荐流程

```
用户: "20块以内减脂餐"
        │
        ▼
┌─────────────────┐
│  意图解析        │  预算=20, 偏好=减脂
└────────┬────────┘
         ▼
┌─────────────────┐
│  向量嵌入        │  text-embedding-3-small
└────────┬────────┘
         ▼
┌─────────────────┐
│  pgvector 检索   │  余弦相似度 top-15
└────────┬────────┘
         ▼
┌─────────────────┐
│  多维过滤排序    │  预算 + 标签 + 评分 + 用户画像
└────────┬────────┘
         ▼
┌─────────────────┐
│  LLM 生成理由    │  DeepSeek 生成推荐文案
└────────┬────────┘
         ▼
    推荐结果卡片
```

---

## 🛠 Tech Stack

### Frontend
- Next.js 16 (App Router) — SSR/ISR
- React 19 + TypeScript 5
- TailwindCSS 4 + Framer Motion
- Zustand (状态管理) + React Query (服务端缓存)
- Leaflet (地图) + Recharts (图表)

### Backend
- Next.js API Routes (Route Handlers)
- Prisma 6 ORM + PostgreSQL 16
- pgvector (向量搜索)
- Redis 7 (缓存 + 排行榜)
- NextAuth v5 (JWT 认证)

### AI / ML
- DeepSeek API (LLM 推理)
- OpenAI text-embedding-3-small (向量化)
- RAG (检索增强生成)
- 情感分析 + 关键词提取

### DevOps
- Docker + Docker Compose
- GitHub Actions CI/CD
- Vitest (单元测试)

---

## 🚀 Quick Start

### 1. 安装依赖

```bash
git clone https://github.com/newuni316/whu-food-guide.git
cd whu-food-guide
npm install
```

### 2. 启动基础设施

```bash
docker compose up -d  # PostgreSQL 16 (含 pgvector) + Redis 7
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入 API Key：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whu_food_guide"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
DEEPSEEK_API_KEY="sk-..."    # 推荐
OPENAI_API_KEY="sk-..."      # 用于 embedding
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@whu.edu.cn | 123456 |
| 用户 | zhangsan@whu.edu.cn | 123456 |
| 用户 | lisi@whu.edu.cn | 123456 |

---

## 📁 项目结构

```
whu-food-guide/
├── prisma/
│   └── schema.prisma           # 18+ 数据模型，pgvector 支持
├── src/
│   ├── app/
│   │   ├── (auth)/             # 登录/注册
│   │   ├── ai-chat/            # AI 助手对话
│   │   ├── cafeteria/          # 食堂详情
│   │   ├── explore/            # 语义搜索 + 探索
│   │   ├── map/                # 校园美食地图
│   │   ├── rankings/           # 排行榜
│   │   ├── profile/            # 个人中心
│   │   ├── admin/              # 管理后台
│   │   ├── api/                # RESTful API
│   │   │   ├── ai/             # AI 相关 API
│   │   │   │   ├── chat/       # RAG 对话
│   │   │   │   └── recommend/  # 智能推荐
│   │   │   ├── search/         # 语义搜索
│   │   │   ├── cafeterias/     # 食堂数据
│   │   │   ├── rankings/       # 排行榜
│   │   │   └── auth/           # 认证
│   │   ├── globals.css         # 设计系统
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── loading.tsx         # 全局 loading
│   │   ├── error.tsx           # 全局 error
│   │   └── global-error.tsx    # 全局错误边界
│   ├── components/
│   │   ├── ui/                 # 基础 UI 组件
│   │   ├── layout/             # 布局组件
│   │   └── ...                 # 业务组件
│   ├── lib/
│   │   ├── ai/                 # AI 模块
│   │   │   ├── client.ts       # LLM 客户端 (DeepSeek/OpenAI)
│   │   │   ├── embedding.ts    # 向量嵌入
│   │   │   ├── vector-search.ts# 向量搜索
│   │   │   ├── retriever.ts    # RAG 检索器
│   │   │   ├── recommender.ts  # 推荐引擎
│   │   │   ├── sentiment.ts    # 情感分析
│   │   │   └── prompts.ts      # Prompt 模板
│   │   ├── api/                # API 工具
│   │   │   └── middleware.ts   # 统一中间件
│   │   ├── cache/              # 缓存层
│   │   │   ├── redis.ts        # Redis 客户端
│   │   │   └── keys.ts         # 缓存键管理
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── prisma.ts           # Prisma 单例
│   │   ├── errors.ts           # 错误处理
│   │   ├── logger.ts           # 日志系统
│   │   ├── api.ts              # 服务端 API
│   │   └── utils.ts            # 工具函数
│   ├── types/
│   │   └── index.ts            # 统一类型定义
│   ├── middleware.ts           # 路由中间件
│   └── scripts/
│       └── seed.ts             # 种子数据
├── data/
│   └── restaurants/            # 18 家食堂 JSON 数据
├── Dockerfile                  # 多阶段构建
├── docker-compose.yml          # PostgreSQL + Redis + App
└── .github/workflows/          # CI/CD
```

---

## 📊 数据库模型

18+ 个模型，完整索引优化：

- **Campus** — 校区（文理/工学/信息/医学/周边）
- **Canteen** — 食堂（坐标、营业状态、排队指数）
- **Window** — 窗口/摊位
- **Dish** — 菜品（价格、营养、标签、向量嵌入）
- **DishEmbedding** — pgvector 向量 (1536维)
- **Review** — 评价（情感分数、关键词）
- **Favorite** — 收藏
- **PriceHistory** — 价格历史
- **RecommendationLog** — 推荐日志
- **User** — 用户（JWT + 画像标签）
- **Ranking** — 排行榜
- **AiChat** — AI 对话记录

---

## 🔌 API 文档

| Method | Route | 描述 |
|--------|-------|------|
| POST | `/api/ai/chat` | RAG 对话（自动检索上下文） |
| POST | `/api/ai/recommend` | 智能推荐 |
| GET | `/api/search?q=...` | 语义搜索 + 结构化筛选 |
| GET | `/api/cafeterias` | 食堂列表 |
| GET | `/api/rankings?type=daily` | 排行榜 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/[...nextauth]` | NextAuth 认证 |

### POST /api/ai/recommend

```json
{
  "query": "20块以内减脂餐",
  "budget": 20,
  "diet": ["减脂"],
  "location": "信息学部"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "dish": { "name": "鸡胸肉沙拉", "price": 18, "..." : "..." },
        "score": 0.85,
        "reason": "高蛋白低脂，完美匹配减脂需求",
        "matchTags": ["减脂", "高蛋白"]
      }
    ],
    "aiResponse": "根据你的需求，推荐以下菜品..."
  }
}
```

### GET /api/search?q=减脂&campus=wenli&priceMax=25

支持自然语言查询 + 结构化过滤 + 分页

---

## 🔒 安全特性

- JWT 认证 (NextAuth v5)
- bcrypt 密码哈希 (12 轮)
- RBAC 权限控制 (user/admin/superadmin)
- Zod 参数校验
- Prisma 参数化查询 (防 SQL 注入)
- React XSS 防护
- 安全头 (X-Frame-Options, X-Content-Type-Options)
- 路由中间件保护

---

## 📈 性能优化

- **Redis 缓存**: 排行榜/食堂详情/搜索结果
- **SSR/ISR**: 服务端渲染 + 增量静态再生
- **防抖搜索**: 300ms 防抖
- **分页查询**: 避免全量加载
- **向量索引**: pgvector HNSW 索引
- **数据库索引**: 全模型索引优化

---

## 🧪 测试

```bash
npm test           # 单元测试
npm run test:e2e   # E2E 测试
```

---

## 🐳 Docker 部署

```bash
docker compose up -d
```

一键启动 PostgreSQL 16 (pgvector) + Redis 7 + Next.js App。

---

## 📄 License

MIT © WHU Food Guide Team
