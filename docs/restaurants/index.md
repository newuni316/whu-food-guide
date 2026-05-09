---
title: 餐厅列表
description: 武汉大学全部美食餐厅，支持筛选和排序
---

<script setup>
import { ref, onMounted } from 'vue'

const allRestaurants = ref([])
const filtered = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/restaurants.json')
    if (res.ok) {
      allRestaurants.value = await res.json()
      filtered.value = allRestaurants.value
    }
  } catch (e) {
    console.error('Failed to load restaurants:', e)
  }
  loading.value = false
})

function onFilterChange(newList) {
  filtered.value = newList
}
</script>

# 🍽️ 餐厅列表

<ClientOnly>
  <div v-if="loading" style="text-align:center;padding:48px;color:#888;">
    加载中...
  </div>

  <div v-else>
    <FilterBar
      :restaurants="allRestaurants"
      @filter-change="onFilterChange"
    />

    <div class="restaurant-count">
      共找到 <strong>{{ filtered.length }}</strong> 家餐厅
    </div>

    <div class="restaurant-grid">
      <RestaurantCard
        v-for="r in filtered"
        :key="r.slug"
        :restaurant="r"
      />
    </div>

    <div v-if="filtered.length === 0" style="text-align:center;padding:48px;color:#888;">
      😅 没有找到符合条件的餐厅，试试调整筛选条件？
    </div>
  </div>
</ClientOnly>

<style>
.restaurant-count {
  margin: 16px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.restaurant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .restaurant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
