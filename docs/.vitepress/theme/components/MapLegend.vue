<template>
  <div class="map-legend">
    <div class="legend-title">图例</div>
    <div v-for="area in areaGroups" :key="area.key" class="legend-item">
      <span class="legend-dot" :style="{ background: area.color }"></span>
      <span>{{ area.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AreaGroup } from '../composables/useMapMarkers'

defineProps<{
  areaGroups: AreaGroup[]
}>()
</script>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 28px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 10px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(6px);
}

.legend-title {
  font-size: 12px;
  font-weight: 700;
  color: #555;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #444;
  margin-bottom: 3px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .map-legend {
    bottom: auto;
    top: 12px;
    right: 12px;
    padding: 8px 10px;
  }
}
</style>
