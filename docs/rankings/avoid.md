---
title: 避雷专区
---

<ClientOnly>
  <RankingList
    title="避雷专区"
    subtitle="评分较低或性价比不高的餐厅，帮你避开雷区"
    :filterFn="(item) => item.rating <= 3 || item.tags.includes('性价比低')"
    :sortFn="(a, b) => a.rating - b.rating"
    emptyText="太好了！目前没有需要避雷的餐厅~"
    :showWarning="true"
  />
</ClientOnly>
