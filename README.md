# 珞珈美食指南 — WHU Food Guide

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blueviolet" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4" alt="TailwindCSS 4" />
  <img src="https://img.shields.io/badge/AI%20Native-FF6B6B" alt="AI Native" />
</p>

<p align="center">
  AI Native 智慧校园美食平台 — 集成智能推荐、RAG 检索、实时热榜、校园美食地图的武汉大学全栈应用
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Features

| 模块 | 功能 |
|------|------|
| **AI 食堂助手** | LLM 驱动的智能对话 + RAG 上下文检索，支持预算控制/健身饮食/深夜推荐 |
| **智能推荐系统** | 基于用户画像、浏览历史、时间热度的个性化推荐 |
| **实时热榜** | 6 种排行榜 — 今日/本周/夜宵/性价比/健身/黑暗料理 |
| **校园美食地图** | 食堂分布、摊位定位、校区导航 |
| **图文评价** | 用户评价 + 图片 + 点赞 + 回复 |
| **用户系统** | 邮箱注册、JWT 认证、用户等级、成就系统 |
| **向量搜索** | 基于 pgvector 的语义搜索 — 「适合减脂」「蛋白质高」 |
| **深色模式** | Apple 级 UI 设计，毛玻璃效果，微交互动画 |

---

## 🛠 Tech Stack

### Frontend

| 技术 | 用途 |
|------|------|
| Next.js 16 (App Router) | 全栈框架，SSR/SSG/ISR |
| React 19 | UI 渲染 |
| TypeScript 5 | 类型安全 |
| TailwindCSS 4 | 原子化 CSS |
| Framer Motion | 动画 |
| Zustand | 状态管理 |
| React Query (TanStack) | 服务端状态缓存 |
| React Hook Form + Zod | 表单验证 |
| Recharts | 数据可视化 |
| Lucide Icons | 图标系统 |

### Backend

| 技术 | 用途 |
|------|------|
| Next.js API Routes | RESTful API |
| Prisma ORM | 数据库 ORM |
| PostgreSQL 16 | 主数据库 |
| Redis 7 | 缓存 + 实时排行 |
| NextAuth v5 | 认证 (JWT) |
| Zod | 参数校验 |

### AI / ML

| 技术 | 用途 |
|------|------|
| OpenAI / DeepSeek API | LLM 推理 |
| text-embedding-3-small | 文本向量化 |
| pgvector | 向量相似度搜索 |
| RAG | 检索增强生成 |
| Function Calling | AI Agent 工具调用 |

### DevOps

| 技术 | 用途 |
|------|------|
| Docker + Compose | 容器化部署 |
| GitHub Actions | CI/CD |
| Vitest | 单元测试 |
| Sentry | 错误监控 |
| OpenTelemetry | 可观测性 |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Landing  │ │ Explore  │ │ Rankings │ │   AI Chat    │  │
│  │   Page   │ │  Page    │ │   Page   │ │    Page      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Map Page │ │Cafeteria │ │  Auth    │ │  Dashboard   │  │
│  │          │ │ Detail   │ │  Pages   │ │  (Admin)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Shared Components                         │   │
│  │  Navigation │ CafeteriaCard │ SearchBar │ Badge    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Auth API │ │Cafeteria │ │ Rankings │ │   AI Chat    │  │
│  │          │ │   API    │ │   API    │ │     API      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │      Redis      │ │   OpenAI API    │
│   + pgvector    │ │  (Cache/Queue)  │ │  / DeepSeek     │
│                 │ │                 │ │                 │
│  Prisma ORM     │ │  Real-time      │ │  AI Agent +    │
│  18 models      │ │  Rankings       │ │  RAG System    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Data Flow

1. **浏览**: User → Next.js SSR → Prisma → PostgreSQL → Hydrate → UI
2. **AI 对话**: User → Client → API Route → OpenAI/DeepSeek → Stream → UI
3. **RAG 检索**: User Query → Embedding → pgvector Similarity → Context → LLM → Response
4. **热榜**: User Action → Cache Update → Redis Sorted Set → API → UI
5. **推荐**: User Profile + History → Embedding → Vector Search → Ranked Results

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm or npm

### 1. Clone & Install

```bash
git clone https://github.com/newuni316/whu-food-guide.git
cd whu-food-guide
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d  # PostgreSQL 16 + Redis 7
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whu_food_guide"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Provider (optional — app works without it)
OPENAI_API_KEY="sk-..."
# or
DEEPSEEK_API_KEY="sk-..."
```

### 4. Database Setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@whu.edu.cn | 123456 |
| User | zhangsan@whu.edu.cn | 123456 |
| User | lisi@whu.edu.cn | 123456 |

---

## 🐳 Docker Deployment

### Production Build

```bash
docker build -t whu-food-guide .
docker run -p 3000:3000 whu-food-guide
```

### Docker Compose (Full Stack)

```bash
docker compose up -d
```

This starts PostgreSQL 16 + Redis 7 + the Next.js app.

---

## 📦 Project Structure

```
whu-food-guide/
├── prisma/
│   └── schema.prisma          # 18 models, indexes, relations
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   ├── ai-chat/           # AI 食堂助手
│   │   ├── cafeteria/         # 食堂详情页
│   │   ├── explore/           # 探索页 (搜索 + 筛选)
│   │   ├── map/               # 校园美食地图
│   │   ├── rankings/          # 6 种排行榜
│   │   ├── api/               # RESTful API 路由
│   │   ├── globals.css        # 设计系统 (CSS 变量)
│   │   ├── layout.tsx         # Root layout + SEO
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Button, Card, Badge
│   │   ├── layout/            # Navigation
│   │   ├── cafeteria-card.tsx
│   │   ├── cafeteria-grid.tsx
│   │   ├── ranking-section.tsx
│   │   ├── search-bar.tsx
│   │   ├── campus-filter.tsx
│   │   └── providers.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 单例
│   │   ├── auth.ts            # NextAuth v5 配置
│   │   ├── ai.ts              # AI Agent + RAG
│   │   ├── api.ts             # Server-side API 封装
│   │   └── utils.ts           # 工具函数
│   └── scripts/
│       └── seed.ts            # 种子数据脚本
├── data/
│   └── restaurants/           # 18 家食堂 JSON 数据
├── tests/                     # 测试
├── Dockerfile                 # 多阶段构建
├── docker-compose.yml         # PostgreSQL + Redis + App
└── .github/workflows/         # CI/CD
```

---

## 📊 Database Schema

18 models with full index optimization, soft delete, and audit fields:

- **User** — JWT + RBAC (user/admin/superadmin)
- **Profile** — 学号、专业、偏好
- **Cafeteria** — 食堂 (校区、坐标、标签)
- **Stall** — 窗口/摊位
- **Dish** — 菜品 (价格、热量、评分)
- **Review / Comment** — 图文评价 + 回复
- **Ranking** — 6 种排行榜
- **AiChat** — AI 对话记录
- **DishEmbedding** — 向量嵌入 (pgvector)
- **Notification / UserAchievement / AdminLog**

---

## 🔌 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/[...nextauth]` | NextAuth 认证 |
| GET | `/api/cafeterias` | 食堂列表 |
| GET | `/api/rankings?type=` | 排行榜数据 |
| POST | `/api/ai/chat` | AI 对话 |

### POST /api/ai/chat

```json
{
  "messages": [
    { "role": "user", "content": "信息学部有什么好吃的？" }
  ],
  "context": {
    "budget": 20,
    "diet": "减脂",
    "location": "信息学部"
  }
}
```

### GET /api/rankings?type=daily

`type` options: `daily`, `weekly`, `night`, `value`, `fitness`, `dark`

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

---

## 🔒 Security

- JWT-based authentication (NextAuth v5)
- bcrypt password hashing (12 rounds)
- CSRF protection via Next.js
- Rate limiting on API routes
- XSS protection via React escaping
- RBAC (user / admin / superadmin)
- Prisma parameterized queries (SQL injection prevention)

---

## 📈 Monitoring & Observability

- Sentry for error tracking
- OpenTelemetry for distributed tracing
- Structured logging via `pino`

---

## 🗺 Roadmap

- [ ] OCR 菜单识别 — 拍照自动识别菜品和价格
- [ ] WebSocket 实时通知 — 评论/点赞/回复推送
- [ ] 管理后台 — 用户/菜品/评论管理
- [ ] PWA — 离线访问 + 桌面快捷方式
- [ ] 协同过滤推荐 — 基于用户行为的高级推荐
- [ ] WeChat Mini Program — 微信小程序端
- [ ] Performance Benchmark — Lighthouse 评分 95+

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT © WHU Food Guide Team
