<template>
  <div class="filter-panel" :class="{ collapsed: panelCollapsed }">
    <button class="panel-toggle" @click="panelCollapsed = !panelCollapsed" :title="panelCollapsed ? '展开筛选' : '收起筛选'">
      <span v-if="panelCollapsed">☰</span>
      <span v-else>✕</span>
    </button>
    <div v-show="!panelCollapsed" class="panel-content">
      <h3 class="panel-title">🔍 筛选餐厅</h3>

      <!-- Search -->
      <div class="filter-section">
        <label class="filter-label">搜索</label>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="search-input"
          placeholder="输入餐厅名称..."
        />
      </div>

      <!-- Area filter -->
      <div class="filter-section">
        <label class="filter-label">校区区域</label>
        <div class="checkbox-group">
          <label v-for="area in areaGroups" :key="area.key" class="checkbox-item">
            <input
              type="checkbox"
              :checked="selectedAreas.includes(area.key)"
              @change="toggleArea(area.key)"
            />
            <span class="area-dot" :style="{ background: area.color }"></span>
            {{ area.label }}
          </label>
        </div>
      </div>

      <!-- Rating filter -->
      <div class="filter-section">
        <label class="filter-label">最低评分</label>
        <div class="rating-buttons">
          <button
            v-for="r in [0, 3, 3.5, 4, 4.5, 5]"
            :key="r"
            class="rating-btn"
            :class="{ active: minRating === r }"
            @click="$emit('update:minRating', r)"
          >
            {{ r === 0 ? '全部' : r + '⭐' }}
          </button>
        </div>
      </div>

      <!-- Count & Reset -->
      <div class="filter-footer">
        <span class="result-count">显示 {{ visibleCount }} / {{ totalCount }} 家</span>
        <button class="reset-btn" @click="$emit('reset')">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AreaGroup } from '../composables/useMapMarkers'

const props = defineProps<{
  areaGroups: AreaGroup[]
  searchQuery: string
  selectedAreas: string[]
  minRating: number
  visibleCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:minRating': [value: number]
  'update:selectedAreas': [value: string[]]
  reset: []
}>()

const panelCollapsed = ref(false)

function toggleArea(key: string) {
  const current = [...props.selectedAreas]
  const idx = current.indexOf(key)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(key)
  }
  emit('update:selectedAreas', current)
}
</script>

<style scoped>
.filter-panel {
  position: absolute;
  top: 56px;
  left: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  max-height: calc(100% - 68px);
  overflow-y: auto;
  width: 240px;
}

.filter-panel.collapsed {
  width: auto;
}

.panel-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 1;
  transition: background 0.2s;
}
.panel-toggle:hover {
  background: #e0e0e0;
}

.panel-content {
  padding: 16px;
  padding-top: 12px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 14px 0;
  padding-right: 32px;
}

.filter-section {
  margin-bottom: 14px;
}

.filter-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.search-input {
  width: 100%;
  padding: 7px 10px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.search-input:focus {
  border-color: #1e88e5;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.checkbox-item input[type='checkbox'] {
  width: 14px;
  height: 14px;
  accent-color: #1e88e5;
}

.area-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.rating-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rating-btn {
  padding: 4px 8px;
  border: 1.5px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: #555;
}
.rating-btn:hover {
  border-color: #f5a623;
}
.rating-btn.active {
  background: #fff8e1;
  border-color: #f5a623;
  color: #e65100;
  font-weight: 600;
}

.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.result-count {
  font-size: 12px;
  color: #888;
}

.reset-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}
.reset-btn:hover {
  background: #f5f5f5;
  color: #333;
}

@media (max-width: 768px) {
  .filter-panel {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 50vh;
  }

  .filter-panel.collapsed {
    width: auto;
    left: auto;
    right: 12px;
    bottom: 12px;
    top: auto;
  }

  .filter-panel.collapsed .panel-toggle {
    position: relative;
    top: 0;
    right: 0;
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 50%;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
