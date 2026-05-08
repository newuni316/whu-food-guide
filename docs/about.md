# 关于

## 珞珈美食指北

**珞珈美食指北** 是一个由武汉大学学生自发创建和维护的校园美食推荐平台。我们希望通过真实的学生评价，帮助每一位珞珈学子找到心仪的好吃的。

## 数据来源

所有餐厅推荐均来自武大学生的真实体验，通过问卷调查收集，并经过人工审核后发布。

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | [VitePress](https://vitepress.dev/) | 基于 Vue 3 的静态站点生成器 |
| UI | [Vue 3](https://vuejs.org/) + Composition API | 组件化开发，支持 TypeScript |
| 地图 | [Leaflet.js](https://leafletjs.com/) + 高德瓦片 | 交互式餐厅地图 |
| 数据处理 | Python + Pandas | 问卷数据清洗与转换 |
| 部署 | GitHub Pages + GitHub Actions | 自动化 CI/CD |

## 如何贡献数据

我们欢迎所有武大同学贡献美食数据！

1. **Fork** 本仓库到你的 GitHub 账号
2. 编辑 `data/mock_survey_data.csv`，按格式添加你的推荐餐厅：
   - `store_name`：餐厅名称
   - `location`：位置（如"文理学部-梅园"）
   - `area`：区域（如"梅园"）
   - `rating`：评分 1-5
   - `tags`：标签（逗号分隔，如"性价比高,量大实惠"）
   - `recommendation`：推荐菜品
   - `review`：用餐体验评价
   - `avg_price`：人均消费（元）
   - `coordinates`：坐标（格式：纬度/经度）
3. 提交 **Pull Request**，我们会尽快审核合并

::: tip 坐标获取
可以在 [高德坐标拾取器](https://lbs.amap.com/tools/picker) 上搜索餐厅位置获取经纬度。
:::

## 管理后台

管理员可通过 [管理后台](/admin/) 对餐厅数据进行增删改查操作，并导出更新后的数据文件。

## 联系我们

- **GitHub Issues**：[提交建议或反馈](https://github.com/newuni316/whu-food-guide/issues)
- **GitHub Discussions**：[参与讨论](https://github.com/newuni316/whu-food-guide/discussions)

如有建议、合作意向或数据纠错，欢迎通过以上方式联系我们。

---

> 🍜 珞珈山上，总有你爱的味道。
