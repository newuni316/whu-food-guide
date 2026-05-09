<template>
  <div class="filter-bar">
    <div class="filter-bar-inner">
      <!-- Search -->
      <div class="filter-search">
        <input
          v-model="searchQuery"
          type="text"
          class="filter-search-input"
          placeholder="搜索餐厅名称、标签..."
          @input="onFilterChange"
        />
        <span class="search-icon">🔍</span>
      </div>

      <!-- Price Range -->
      <div class="filter-group">
        <label class="filter-label">价格区间</label>
        <div class="price-range">
          <span class="price-val">¥{{ priceMin }}</span>
          <input
            v-model.number="priceMin"
            type="range"
            min="0"
            max="100"
            step="5"
            class="range-slider"
            @input="onFilterChange"
          />
          <input
            v-model.number="priceMax"
            type="range"
            min="0"
            max="100"
            step="5"
            class="range-slider"
            @input="onFilterChange"
          />
          <span class="price-val">¥{{ priceMax >= 100 ? '100+' : priceMax }}</span>
        </div>
      </div>

      <!-- Tags -->
      <div class="filter-group">
        <label class="filter-label">标签筛选</label>
        <div class="tag-list">
          <button
            v-for="tag in allTags"
            :key="tag"
            class="tag-btn"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Sort -->
      <div class="filter-group">
        <label class="filter-label">排序方式</label>
        <div class="sort-options">
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            class="sort-btn"
            :class="{ active: sortBy === opt.value }"
            @click="setSort(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Stats & Reset -->
      <div class="filter-footer">
        <span class="filter-count">共 {{ filteredCount }} 家</span>
        <button class="filter-reset" @click="resetFilters">重置筛选</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Restaurant {
  name: string
  slug: string
  campus: string
  area: string
  location: string
  category: string[]
  price_range: [number, number]
  avg_price: number
  rating: { taste: number; environment: number; value: number }
  coordinates: { lat: number; lng: number }
  address: string
  hours: string
  phone: string
  recommendations: string[]
  tags: string[]
  review: string
  source: string
  last_verified: string
  contributor: string
}

const props = defineProps<{
  restaurants: Restaurant[]
}>()

const emit = defineEmits<{
  (e: 'filter-change', restaurants: Restaurant[]): void
}>()

const searchQuery = ref('')
const priceMin = ref(0)
const priceMax = ref(100)
const selectedTags = ref<string[]>([])
const sortBy = ref('rating')

const sortOptions = [
  { label: '评分优先', value: 'rating' },
  { label: '价格从低到高', value: 'price-asc' },
  { label: '价格从高到低', value: 'price-desc' },
]

const allTags = computed(() => {
  const tagSet = new Set<string>()
  for (const r of props.restaurants) {
    for (const t of r.tags) tagSet.add(t)
    for (const c of r.category) tagSet.add(c)
  }
  return [...tagSet].sort()
})

function getAvgRating(r: Restaurant): number {
  return (r.rating.taste + r.rating.environment + r.rating.value) / 3
}

const filtered = computed(() => {
  let list = [...props.restaurants]

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)) ||
        r.category.some((c) => c.includes(q)) ||
        r.area.includes(q)
    )
  }

  // Price
  list = list.filter((r) => {
    const max = priceMax.value >= 100 ? Infinity : priceMax.value
    return r.avg_price >= priceMin.value && r.avg_price <= max
  })

  // Tags
  if (selectedTags.value.length > 0) {
    list = list.filter((r) => {
      const all = [...r.tags, ...r.category]
      return selectedTags.value.some((t) => all.includes(t))
    })
  }

  // Sort
  if (sortBy.value === 'rating') {
    list.sort((a, b) => getAvgRating(b) - getAvgRating(a))
  } else if (sortBy.value === 'price-asc') {
    list.sort((a, b) => a.avg_price - b.avg_price)
  } else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => b.avg_price - a.avg_price)
  }

  return list
})

const filteredCount = computed(() => filtered.value.length)

function onFilterChange() {
  emit('filter-change', filtered.value)
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
  onFilterChange()
}

function setSort(val: string) {
  sortBy.value = val
  onFilterChange()
}

function resetFilters() {
  searchQuery.value = ''
  priceMin.value = 0
  priceMax.value = 100
  selectedTags.value = []
  sortBy.value = 'rating'
  onFilterChange()
}

// Emit initial list
watch(
  () => props.restaurants,
  () => onFilterChange(),
  { immediate: true }
)
</script>

<style scoped>
.filter-bar {
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.filter-bar-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Search */
.filter-search {
  position: relative;
}
.filter-search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 1.5px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 8px;
  font-size: 14px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #1a1a1a);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.filter-search-input:focus {
  border-color: var(--vp-c-brand-1, #1e88e5);
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  pointer-events: none;
}

/* Groups */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Price range */
.price-range {
  display: flex;
  align-items: center;
  gap: 10px;
}
.range-slider {
  flex: 1;
  accent-color: var(--vp-c-brand-1, #1e88e5);
  height: 4px;
}
.price-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1, #e65100);
  min-width: 40px;
  text-align: center;
}

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-btn {
  padding: 4px 12px;
  border: 1.5px solid var(--vp-c-divider, #e0e0e0);
  border-radius: 16px;
  background: var(--vp-c-bg, #fff);
  font-size: 12px;
  color: var(--vp-c-text-2, #555);
  cursor: pointer;
  transition: all 0.15s;
}
.tag-btn:hover {
  border-color: var(--vp-c-brand-1, #1e88e5);
}
.tag-btn.active {
  background: var(--vp-c-brand-soft, #e3f2fd);
  border-color: var(--vp-c-brand-1, #1e88e5);
  color: var(--vp-c-brand-1, #1565c0);
  font-weight: 600;
}

/* Sort */
.sort-options {
  display: flex;
  gap: 6px;
}
.sort-btn {
  padding: 5px 14px;
  border: 1.5px solid var(--vp-c-divider, #e0e0e0);
  border-radius: 8px;
  background: var(--vp-c-bg, #fff);
  font-size: 12px;
  color: var(--vp-c-text-2, #555);
  cursor: pointer;
  transition: all 0.15s;
}
.sort-btn:hover {
  border-color: var(--vp-c-brand-1, #1e88e5);
}
.sort-btn.active {
  background: var(--vp-c-brand-soft, #e3f2fd);
  border-color: var(--vp-c-brand-1, #1e88e5);
  color: var(--vp-c-brand-1, #1565c0);
  font-weight: 600;
}

/* Footer */
.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider, #eee);
}
.filter-count {
  font-size: 13px;
  color: var(--vp-c-text-3, #888);
}
.filter-reset {
  padding: 5px 14px;
  border: 1px solid var(--vp-c-divider, #ddd);
  border-radius: 6px;
  background: var(--vp-c-bg, #fff);
  font-size: 12px;
  color: var(--vp-c-text-2, #666);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-reset:hover {
  background: var(--vp-c-bg-soft, #f5f5f5);
}

@media (max-width: 768px) {
  .filter-bar {
    padding: 14px;
  }
  .sort-options {
    flex-wrap: wrap;
  }
}
</style>
