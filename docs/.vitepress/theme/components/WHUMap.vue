<template>
  <ClientOnly>
    <div ref="mapContainer" class="whu-map"></div>
    <template #fallback>
      <div class="whu-map whu-map-loading">🗺️ 地图加载中...</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

interface MarkerItem {
  name: string
  lat: number
  lng: number
  rating: number
  tags: string[]
  location: string
}

function getStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty)
}

onMounted(async () => {
  if (!mapContainer.value) return

  // Dynamic import to avoid SSR issues
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  map = L.map(mapContainer.value).setView([30.540, 114.361], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  try {
    const resp = await fetch('/markers.json')
    const markers: MarkerItem[] = await resp.json()

    markers.forEach((item) => {
      const tagsHtml = item.tags
        .map((t) => `<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:4px;font-size:12px;margin:1px;">${t}</span>`)
        .join(' ')

      const popupContent = `
        <div style="min-width:160px;">
          <strong style="font-size:15px;">${item.name}</strong><br/>
          <span style="font-size:13px;">${getStars(item.rating)} ${item.rating}</span><br/>
          <span style="font-size:12px;color:#666;">📍 ${item.location}</span><br/>
          <div style="margin-top:4px;">${tagsHtml}</div>
        </div>
      `

      L.marker([item.lat, item.lng])
        .addTo(map)
        .bindPopup(popupContent)
    })
  } catch (e) {
    console.error('Failed to load markers:', e)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.whu-map {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.whu-map-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
  font-size: 16px;
}
</style>
