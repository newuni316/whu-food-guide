---
title: 约会必去榜
---

<ClientOnly>
  <RankingList
    title="约会必去榜"
    subtitle="环境好、适合聚餐的高分餐厅，约会/聚餐首选"
    :filterFn="(item) => (item.tags.includes('环境好') || item.tags.includes('适合聚餐')) && item.rating >= 4"
    :sortFn="(a, b) => b.rating - a.rating"
    emptyText="暂无符合条件的餐厅，快去填写问卷推荐吧~"
    :showDateReason="true"
  />
</ClientOnly>
