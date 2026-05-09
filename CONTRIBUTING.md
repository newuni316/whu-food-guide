# 🤝 贡献指南

感谢你为珞珈美食指北贡献数据！

## 三种投稿方式

### 方式一：Issue 表单（推荐，最简单）
1. 点击 [推荐新餐厅](https://github.com/newuni316/whu-food-guide/issues/new?template=add-restaurant.yml)
2. 填写表单，提交即可
3. 管理员审核后会自动合并

### 方式二：在线编辑 JSON
1. 打开 [餐厅模板](https://github.com/newuni316/whu-food-guide/blob/main/data/restaurants/template.json)
2. 点击编辑按钮，填写餐厅信息
3. 提交 PR

### 方式三：本地开发
1. Fork 本仓库
2. 在 data/restaurants/ 目录下创建 {slug}.json
3. 运行 `python3 scripts/process_data.py --validate-only` 验证
4. 提交 PR

## 数据格式规范
参见 data/schema.json

## 审核流程
1. 提交 Issue 或 PR
2. 管理员审核数据准确性
3. 合并后自动部署到 GitHub Pages

## 标签规范
- 性价比高：人均 < 20 元
- 适合聚餐：可容纳 4+ 人
- 深夜食堂：营业到 22:00 以后
- 环境好：装修/氛围有特色
- 出餐快：等待 < 10 分钟
- 量大实惠：份量大
- 一人食：适合独自就餐
- 外卖推荐：外卖体验好
- 早餐：提供早餐
- 咖啡：有咖啡饮品
