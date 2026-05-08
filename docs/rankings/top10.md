---
title: 口碑 Top 10
---

<ClientOnly>
  <RankingList
    title="口碑 Top 10"
    subtitle="综合评分最高的武大周边餐厅，来自真实学生评价"
    :filterFn="(item) => true"
    :sortFn="(a, b) => b.rating - a.rating || b.avg_price - a.avg_price"
    :limit="10"
  />
</ClientOnly>
