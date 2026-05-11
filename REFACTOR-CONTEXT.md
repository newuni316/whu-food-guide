# 武大美食指北 重构上下文

> 本文件用于在新对话中快速恢复重构进度。
> 发送给 Claude 时附上本文件即可继续。

---

## 项目基本信息

- **仓库**: https://github.com/newuni316/whu-food-guide.git
- **本地路径**: C:\Users\l3378\Desktop\whu-food-guide (WSL: /mnt/c/Users/l3378/Desktop/whu-food-guide)
- **技术栈**: Next.js 16 + React 19 + TypeScript 5 + Prisma 6 + PostgreSQL 16 + pgvector + Redis 7 + DeepSeek API
- **架构**: Next.js 全栈（不拆后端），DeepSeek 作为主 AI 模型

---

## 已完成的工作

### Phase 1: 地基 ✅

**Prisma Schema** (`prisma/schema.prisma`)
- 完全重写，18+ 模型
- `Cafeteria` → `Canteen`，`Stall` → `Window`
- 新增 `Campus` 模型替代硬编码枚举
- `Dish` 增加营养字段（calories/protein/fat/carbs）
- `DishEmbedding` 改用 `Unsupported("vector(1536)")` (pgvector)
- `Review` 增加 `sentiment`/`keywords` 情感分析字段
- 新增 `PriceHistory`、`RecommendationLog`
- `User` 增加 `dietTags` 画像标签
- 启用 `postgresqlExtensions = [vector]`
- 全模型增加 `deletedAt` 软删除 + 索引

**类型系统** (`src/types/index.ts`)
- ApiResponse/Pagination/RecommendRequest/RecommendResult/SearchParams 等

**缓存层**
- `src/lib/cache/redis.ts` — Redis 客户端 + graceful degradation + withCache 封装
- `src/lib/cache/keys.ts` — 缓存键命名空间 + TTL 策略

**错误处理 + 日志**
- `src/lib/errors.ts` — AppError/ValidationError/NotFoundError/AIError + handleApiError
- `src/lib/logger.ts` — 结构化日志 + createTimer 性能计时

**API 中间件** (`src/lib/api/middleware.ts`)
- successResponse/createPagination/parsePagination
- withAuth/withRole 认证中间件
- withErrorHandling 错误包装
- createMethodHandler 方法路由

**路由保护** (`src/middleware.ts`)
- /profile 需登录，/admin 需管理员权限
- 安全头 (X-Frame-Options, X-Content-Type-Options)

**loading/error 全覆盖** (11 个文件)
- global-error.tsx, loading.tsx, error.tsx
- explore/, rankings/, ai-chat/, cafeteria/[slug]/map 各有 loading + error

**旧 API 路由重写**
- `/api/cafeterias` — 使用 Canteen 模型 + Redis 缓存
- `/api/rankings` — 使用 Canteen 模型 + Redis 缓存
- `/api/auth/register` — Zod 校验 + 统一错误处理

### Phase 2: AI 核心 ✅

**AI 模块** (`src/lib/ai/`)
- `client.ts` — LLM 客户端（DeepSeek/OpenAI 双支持 + 流式）
- `embedding.ts` — 向量嵌入（单个/批量/菜品文本构建/批量嵌入所有菜品）
- `vector-search.ts` — pgvector 语义搜索 + 相似菜品 + 降级文本搜索
- `retriever.ts` — RAG 检索器（意图解析 + 上下文构建 + 格式化）
- `recommender.ts` — 推荐引擎（多维加权排序 + LLM 生成理由 + 推荐日志）
- `sentiment.ts` — 情感分析 + 关键词提取 + 评论摘要
- `prompts.ts` — Prompt 模板集中管理

**兼容入口** (`src/lib/ai.ts`)
- 重新导出新模块 + 旧 chatWithAI 兼容函数

**新 API 路由**
- `POST /api/ai/recommend` — 智能推荐
- `GET /api/search` — 语义搜索 + 结构化筛选 + 分页
- `POST /api/ai/chat` — 重写，接入 RAG

**种子数据** (`src/scripts/seed.ts`)
- 完全重写：Campus → Canteen → Window → Dish 层级
- 模拟评价（15 条模板 + 情感分数 + 关键词）
- 营养数据模板（按菜品类目随机）
- 可选 embedding 生成（需 OPENAI_API_KEY）

### Phase 3: 产品功能 ✅

**API 路由**
- `GET/PUT /api/user/profile` — 用户画像
- `GET/POST/DELETE /api/user/favorites` — 收藏
- `GET/POST /api/reviews` — 评价（自动情感分析）

**页面**
- `src/app/profile/page.tsx` — 个人中心（概览/收藏/设置）
- `src/app/explore/page.tsx` + `explore-content.tsx` — 语义搜索 + 筛选 + 分页
- `src/app/rankings/page.tsx` + `rankings-content.tsx` — 真实数据排行榜
- `src/app/ai-chat/page.tsx` — 快捷标签 + 对话 UI

**管理后台**
- `src/app/admin/layout.tsx` — 权限校验 + 侧边导航
- `src/app/admin/page.tsx` — 数据概览
- `src/app/admin/canteens/page.tsx` — 食堂管理
- `src/app/admin/reviews/page.tsx` — 评论审核
- `src/app/admin/users/page.tsx` — 用户管理

**其他更新**
- `src/lib/api.ts` — 重写（getCanteens/getCanteenBySlug + 兼容别名）
- `src/app/cafeteria/[slug]/page.tsx` — 重写（新模型 + 营业状态 + 排队指数）
- `.env.example` — 更新
- `README.md` — 完全重写

---

## 已完成的工作（续）

### Phase 4: UI 体验升级 ✅

- **设计系统** — globals.css 新增语义色（success/warning/info/surface/overlay）、阴影 token、动画（slideIn/queuePulse/stagger）、修复 dark 模式 destructive
- **UI 组件库** — 12 个新组件：skeleton、input、textarea、select、dialog、dropdown-menu、toast+toaster（zustand store）、tabs、avatar、tooltip、slider、progress
- **动画系统** — `src/lib/animations.ts` + `MotionWrapper` 组件（fadeInUp/slideIn/stagger/hover）
- **首页重构** — 全屏 Hero + MotionWrapper 动画 + 热门菜品轮播 + 实时排队指数 + 精选评价
- **食堂详情页** — 改用 `getCanteenBySlug()`（Redis 缓存）+ Progress 排队 + 情感标签评价 + MotionWrapper 动画
- **地图页** — Leaflet 真实地图 + 自定义 div 标记（按校区配色）+ Popup 详情 + 搜索筛选 + 侧边栏 + SSR dynamic import
- **移动端底部导航** — BottomNav（md:hidden）+ framer-motion layoutId 活跃指示器 + safe area
- **骨架屏优化** — Skeleton 组件 + cafeteria detail loading 重写
- **深色模式** — 修复 destructive 色值 + 补全所有语义色 dark 变体
- **Bug 修复** — 删除死组件（search-bar/ranking-section）、重写 cafeteria-card/grid 类型、AI chat withAuth、Redis SCAN、rankings 类型对齐、错误 UI（explore/rankings/ai-chat）

### Phase 5: 工程化 + 运维 ✅

- **Docker** — pgvector/pgvector:pg16 镜像、Redis 持久化+AOF、app HEALTHCHECK、.dockerignore
- **CI/CD** — pgvector 测试服务、覆盖率报告（vitest --coverage + artifact 上传）
- **Husky + lint-staged** — pre-commit hook + eslint --fix + prettier --write + .prettierrc.json
- **API 文档** — `docs/api/openapi.yaml`（OpenAPI 3.0，全路由）+ `/api/docs` 端点
- **监控** — Sentry 配置（client/server/edge）+ next.config.ts withSentryConfig + error pages captureException
- **其他** — middleware.ts RouteHandler 类型修复（Next.js 16 params Promise）、types/index.ts ReviewWithUser 修复

---

## 关键架构决策

1. **保持 Next.js 全栈** — 不拆后端，API Routes + Server Actions
2. **DeepSeek 为主** — 性价比高，国内访问快，OpenAI SDK 兼容
3. **pgvector 而非独立向量库** — 减少依赖，PostgreSQL 原生扩展
4. **Redis 可选** — graceful degradation，无 Redis 时降级为无缓存
5. **兼容性保留** — getCafeterias = getCanteens 别名，旧 ai.ts 重新导出

## 需要安装的依赖

```bash
npm install ioredis
npm install -D @types/bcryptjs husky lint-staged
npm install @sentry/nextjs  # 可选，错误监控
```

## 启动方式

```bash
docker compose up -d          # PostgreSQL + Redis
cp .env.example .env.local    # 填入 API Key
npx prisma generate
npx prisma db push
npm run db:seed               # 导入种子数据
npm run dev                   # 启动开发服务器
```

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@whu.edu.cn | 123456 |
| 用户 | zhangsan@whu.edu.cn | 123456 |
| 用户 | lisi@whu.edu.cn | 123456 |

---

## 继续指令

发送本文件给 Claude，然后说：

> 继续重构 武大美食指北，执行 Phase 4（UI 体验升级）。
> 重点：首页重构、食堂详情页重构、地图页接入 Leaflet、移动端底部导航、Framer Motion 动画。

或：

> 继续重构 武大美食指北，执行 Phase 5（工程化）。
> 重点：Docker 优化、CI/CD、Husky、API 文档。
