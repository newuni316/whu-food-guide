# 数据目录说明

本目录存放美食推荐数据，每个餐厅/小吃店对应一个 Markdown 文件，存放在 `restaurants/` 子目录下。

## Frontmatter Schema

每个 `.md` 文件使用 YAML frontmatter 描述店铺结构化数据：

```yaml
---
title: 店名                    # 必填，餐厅或小吃店名称
location: 文理学部-梅园         # 必填，校区/位置（单选值）
rating: 4                      # 必填，综合评分（1-5 整数）
tags: [性价比高, 一人食]        # 必填，体验标签（列表，至少 1 项）
recommendation: 推荐菜品        # 必填，最推荐的 1-3 道菜
avg_price: 15                  # 必填，人均消费（元，整数）
coordinates: [30.540, 114.361] # 选填，经纬度坐标 [纬度, 经度]，用于地图标注
address: 桂园食堂三楼           # 选填，具体地址描述
hours: 10:00-22:00            # 选填，营业时间
phone: "13800138000"           # 选填，联系电话
---
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 店铺名称，与问卷 Q1 对应 |
| `location` | string | ✅ | 校区位置，取值范围见下方 |
| `rating` | integer | ✅ | 评分 1-5，来自问卷 Q5 |
| `tags` | list[string] | ✅ | 体验标签，来自问卷 Q6 |
| `recommendation` | string | ✅ | 推荐菜品，来自问卷 Q4 |
| `avg_price` | integer | ✅ | 人均消费（元），来自问卷 Q8 |
| `coordinates` | list[float] | ❌ | `[纬度, 经度]`，后续通过地图 API 补充 |
| `address` | string | ❌ | 具体地址，来自问卷 Q3 |
| `hours` | string | ❌ | 营业时间，后续人工补充 |
| `phone` | string | ❌ | 联系电话，后续人工补充 |

### location 取值范围

```
文理学部-梅园 | 文理学部-桂园 | 文理学部-枫园 | 文理学部-樱园
工学部 | 信息学部 | 医学部
街道口 | 广埠屯 | 八一路
```

### tags 取值范围

```
性价比高 | 深夜食堂 | 环境好 | 出餐快 | 量大实惠 | 避雷
适合聚餐 | 一人食 | 外卖推荐 | 甜品饮品 | 早餐 | 咖啡
```

---

## 文件示例

文件名: `restaurants/lao-gan-ma-chao-fan.md`

```markdown
---
title: 老干妈炒饭
location: 文理学部-梅园
rating: 5
tags: [性价比高, 量大实惠, 一人食]
recommendation: 老干妈蛋炒饭、虎皮青椒
avg_price: 12
coordinates: [30.5401, 114.3688]
address: 梅园食堂门口右侧
hours: "17:00-01:00"
---

梅园门口的深夜灵魂美食。老干妈炒饭一绝，十块钱就能吃到撑。
老板手脚麻利，高峰期也不用等太久。蛋炒饭粒粒分明，
老干妈的香辣味渗透到每一粒米饭里。

**推荐吃法**: 加一个荷包蛋，配一碗紫菜蛋花汤。
**小贴士**: 晚上10点以后去人少，老板还会多给一点。
```

---

## mock_survey_data.csv

`mock_survey_data.csv` 是问卷数据的模拟样本，用于开发和测试阶段。

### CSV 字段映射

| CSV 列名 | 来源 | 说明 |
|-----------|------|------|
| `store_name` | Q1 | 店名 |
| `location` | Q2 | 完整位置（如"文理学部-梅园"） |
| `area` | Q2 提取 | 区域简称（如"梅园"） |
| `rating` | Q5 | 评分 1-5 |
| `tags` | Q6 | 体验标签（逗号分隔） |
| `recommendation` | Q4 | 推荐菜品 |
| `review` | Q7 | 详细评价 |
| `avg_price` | Q8 | 人均消费（元） |

---

## 数据处理流程

```
腾讯问卷导出 CSV
       ↓
scripts/process_survey.py (数据清洗)
       ↓
data/restaurants/*.md (Hugo Markdown 文件)
       ↓
Hugo 构建 → 美食地图页面
```

---

*文档维护: 项目创建时自动生成 | 最后更新: 2026-05*
