# 🍜 珞珈美食指北

> 武汉大学最全美食攻略，由武大学生共同维护

## 项目简介

**珞珈美食指北** 是一个基于 VitePress 构建的静态网站，收录了武汉大学各校区及周边商圈的美食推荐。所有数据来自武大学生的真实评价。

## 功能特色

- 🗺️ **交互式地图** — 基于 Leaflet.js 的餐厅地图，一键查看所有推荐
- 📱 **响应式设计** — 手机、平板、电脑均可流畅浏览
- 🔍 **全文搜索** — 内置搜索功能，快速找到你想吃的
- 📊 **数据驱动** — Python 脚本自动处理问卷数据，生成页面

## 技术栈

- **框架**: [VitePress](https://vitepress.dev/) (Vue 3 + Vite)
- **地图**: [Leaflet.js](https://leafletjs.com/) + OpenStreetMap
- **数据处理**: Python + Pandas
- **部署**: GitHub Pages + GitHub Actions

## 目录结构

```
whu-food-guide/
├── docs/                    # VitePress 文档源
│   ├── .vitepress/          # VitePress 配置和主题
│   ├── wenli/               # 文理学部 (梅园/桂园/枫园/樱园)
│   ├── gongxue/             # 工学部
│   ├── xinxixue/            # 信息学部
│   ├── yixue/               # 医学部
│   ├── surroundings/        # 周边商圈 (街道口/广埠屯/八一路)
│   └── public/              # 静态资源 (markers.json)
├── data/                    # 问卷数据和文档
├── scripts/                 # 数据处理脚本
└── .github/workflows/       # CI/CD 配置
```

## 本地开发

```bash
# 安装依赖
npm install

# 处理问卷数据 (生成 markdown + markers.json)
python3 scripts/process_survey.py

# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build
```

## 数据来源

所有餐厅推荐来自武大学生的真实问卷调查。问卷设计详见 `docs/survey_design.md`。

## 贡献方式

1. Fork 本仓库
2. 在 `data/mock_survey_data.csv` 中添加你的推荐
3. 运行 `python3 scripts/process_survey.py` 生成页面
4. 提交 Pull Request

## 许可证

MIT License

---

> 🏔️ 珞珈山上，总有你爱的味道。
