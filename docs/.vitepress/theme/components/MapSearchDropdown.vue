<template>
  <div v-if="results.length > 0 && query.length > 0" class="search-results">
    <div
      v-for="item in results"
      :key="item.name"
      class="search-result-item"
      @click="$emit('select', item)"
    >
      <span class="result-dot" :style="{ background: getAreaColor(item.area) }"></span>
      <span class="result-name">{{ item.name }}</span>
      <span class="result-rating">{{ item.rating }}⭐</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarkerItem } from '../composables/useMapMarkers'

defineProps<{
  results: MarkerItem[]
  query: string
  getAreaColor: (area: string) => string
}>()

defineEmits<{
  select: [item: MarkerItem]
}>()
</script>

<style scoped>
.search-results {
  position: absolute;
  top: 60px;
  left: 12px;
  z-index: 1001;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  width: 240px;
  max-height: 260px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
}
.search-result-item:hover {
  background: #f5f7fa;
}
.search-result-item:first-child {
  border-radius: 10px 10px 0 0;
}
.search-result-item:last-child {
  border-radius: 0 0 10px 10px;
}

.result-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.result-name {
  flex: 1;
  color: #1a1a1a;
  font-weight: 500;
}

.result-rating {
  font-size: 12px;
  color: #f5a623;
}

@media (max-width: 768px) {
  .search-results {
    left: 12px;
    right: 12px;
    width: auto;
    bottom: 200px;
    top: auto;
  }
}
</style>
