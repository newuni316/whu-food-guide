<template>
  <ClientOnly>
    <div class="whu-map-wrapper">
      <!-- Campus Filter Tabs -->
      <div class="campus-tabs">
        <button
          v-for="tab in campusTabs"
          :key="tab.key"
          class="campus-tab"
          :class="{ active: activeCampus === tab.key }"
          :style="activeCampus === tab.key ? { background: tab.color, borderColor: tab.color } : {}"
          @click="handleCampusFilter(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Filter Panel -->
      <MapFilterPanel
        :area-groups="areaGroups"
        :search-query="searchQuery"
        :selected-areas="selectedAreas"
        :min-rating="minRating"
        :visible-count="visibleCount"
        :total-count="totalCount"
        @update:search-query="searchQuery = $event"
        @update:min-rating="minRating = $event"
        @update:selected-areas="selectedAreas = $event"
        @reset="handleReset"
      />

      <!-- Search Results Dropdown -->
      <MapSearchDropdown
        :results="searchResults"
        :query="searchQuery"
        :get-area-color="getAreaColor"
        @select="focusMarker"
      />

      <!-- Map Container -->
      <div ref="mapContainer" class="whu-map"></div>

      <!-- Legend -->
      <MapLegend :area-groups="areaGroups" />

      <!-- Geolocation Button -->
      <button class="geo-btn" @click="locateUser" :title="locating ? '定位中...' : '我的位置'">
        <span v-if="locating">⏳</span>
        <span v-else>📍</span>
      </button>

      <!-- Fit All Button -->
      <button class="fit-btn" @click="fitAllMarkers" title="查看所有标记">
        🎯 全部
      </button>
    </div>

    <template #fallback>
      <div class="whu-map whu-map-loading">🗺️ 地图加载中...</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMapMarkers, campusTabs, type MarkerItem } from '../composables/useMapMarkers'
import MapFilterPanel from './MapFilterPanel.vue'
import MapSearchDropdown from './MapSearchDropdown.vue'
import MapLegend from './MapLegend.vue'

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let L: any = null
let markerClusterGroup: any = null
let resizeObserver: ResizeObserver | null = null
let userLocationMarker: any = null
let userLocationCircle: any = null
const locating = ref(false)

const {
  areaGroups,
  allMarkerObjs,
  searchQuery,
  selectedAreas,
  minRating,
  activeCampus,
  totalCount,
  visibleCount,
  searchResults,
  getAreaColor,
  getAreaKey,
  getStars,
  loadMarkers,
  loadAreaGroups,
  resetFilters,
} = useMapMarkers()

function createDivIcon(area: string, isActive: boolean = true) {
  if (!L) return null
  const color = getAreaColor(area)
  const opacity = isActive ? '1' : '0.3'
  const size = isActive ? 14 : 10
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      opacity:${opacity};
      transition: all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  })
}

function buildPopupContent(item: MarkerItem): string {
  const color = getAreaColor(item.area)
  const stars = getStars(item.rating)
  const tagsHtml = item.tags
    .map(t => `<span style="
      display:inline-block;
      background:${color}15;
      color:${color};
      padding:2px 8px;
      border-radius:12px;
      font-size:11px;
      margin:2px 2px;
      border:1px solid ${color}30;
      font-weight:500;
    ">${t}</span>`)
    .join('')
  const priceHtml = item.avg_price
    ? `<div style="margin:6px 0;font-size:13px;color:#e65100;font-weight:600;">💰 人均 ¥${item.avg_price}</div>`
    : ''
  const recHtml = item.recommendation
    ? `<div style="margin:6px 0;font-size:12px;color:#555;line-height:1.5;">
        <span style="color:#888;">推荐：</span>${item.recommendation}
      </div>`
    : ''

  let badgesHtml = ''
  if (item.admin_added) {
    badgesHtml += `<span style="display:inline-block;background:#8e24aa;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">管理员推荐</span>`
  }
  if (item.student_verified) {
    badgesHtml += `<span style="display:inline-block;background:#2e7d32;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;">学生认证</span>`
  }
  if (badgesHtml) {
    badgesHtml = `<div style="margin-bottom:6px;">${badgesHtml}</div>`
  }

  const imgHtml = item.image_url
    ? `<img src="${item.image_url}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'" />`
    : ''

  const navUrl = `https://api.map.baidu.com/marker?location=${item.lat},${item.lng}&title=${encodeURIComponent(item.name)}&content=${encodeURIComponent(item.address || item.location)}&output=html`
  const navHtml = `<a href="${navUrl}" target="_blank" rel="noopener" style="
    display:inline-block;
    margin-top:8px;
    padding:5px 14px;
    background:${color};
    color:#fff;
    border-radius:6px;
    font-size:12px;
    text-decoration:none;
    font-weight:500;
    transition:opacity 0.2s;
  " onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">🧭 百度导航</a>`

  return `
    <div style="min-width:200px;max-width:280px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${imgHtml}
      <div style="
        font-size:16px;
        font-weight:700;
        color:#1a1a1a;
        margin-bottom:6px;
        padding-bottom:6px;
        border-bottom:2px solid ${color}30;
      ">${item.name}</div>
      ${badgesHtml}
      <div style="margin-bottom:4px;">
        <span style="color:#f5a623;font-size:14px;letter-spacing:1px;">${stars}</span>
        <span style="font-size:13px;color:#333;font-weight:600;margin-left:4px;">${item.rating}</span>
      </div>
      <div style="font-size:12px;color:#777;margin-bottom:4px;">📍 ${item.location}</div>
      ${priceHtml}
      ${recHtml}
      <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:2px;">${tagsHtml}</div>
      ${navHtml}
    </div>
  `
}

function applyFilters() {
  if (!markerClusterGroup) return

  markerClusterGroup.clearLayers()

  for (const entry of allMarkerObjs) {
    const matchesCampus = activeCampus.value === 'all' || matchCampus(entry.item)
    const matchesArea = selectedAreas.value.length === 0 || selectedAreas.value.includes(getAreaKey(entry.item.area))
    const matchesRating = entry.item.rating >= minRating.value
    const matchesSearch = !searchQuery.value || entry.item.name.includes(searchQuery.value)
    const visible = matchesCampus && matchesArea && matchesRating && matchesSearch

    if (visible) {
      entry.marker.setIcon(createDivIcon(entry.item.area, true))
      markerClusterGroup.addLayer(entry.marker)
    }
  }
}

function matchCampus(item: MarkerItem): boolean {
  const tab = campusTabs.find(t => t.key === activeCampus.value)
  if (!tab || tab.campus.length === 0) return true
  const itemCampus = item.campus || getAreaKey(item.area)
  return tab.campus.includes(itemCampus)
}

function handleReset() {
  resetFilters()
}

function handleCampusFilter(key: string) {
  activeCampus.value = key
  selectedAreas.value = []
}

function focusMarker(item: MarkerItem) {
  const entry = allMarkerObjs.find(e => e.item === item)
  if (!entry || !map) return
  searchQuery.value = ''
  selectedAreas.value = [getAreaKey(item.area)]
  if (item.campus) {
    const matchingTab = campusTabs.find(t => t.campus.includes(item.campus))
    if (matchingTab) activeCampus.value = matchingTab.key
  }
  minRating.value = 0
  applyFilters()
  map.flyTo([item.lat, item.lng], 17, { duration: 0.8 })
  setTimeout(() => entry.marker.openPopup(), 400)
}

function fitAllMarkers() {
  if (!map || allMarkerObjs.length === 0) return
  resetFilters()
  const group = L.latLngBounds(allMarkerObjs.map(e => [e.item.lat, e.item.lng]))
  map.fitBounds(group.pad(0.2))
}

function locateUser() {
  if (!map || !navigator.geolocation) return
  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false
      const { latitude, longitude } = position.coords

      if (userLocationMarker) map.removeLayer(userLocationMarker)
      if (userLocationCircle) map.removeLayer(userLocationCircle)

      userLocationMarker = L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: '#1e88e5',
        fillOpacity: 1,
        color: '#fff',
        weight: 3,
        opacity: 1,
      }).addTo(map).bindPopup('📍 我的位置')

      userLocationCircle = L.circle([latitude, longitude], {
        radius: position.coords.accuracy,
        fillColor: '#1e88e5',
        fillOpacity: 0.1,
        color: '#1e88e5',
        weight: 1,
        opacity: 0.3,
      }).addTo(map)

      map.flyTo([latitude, longitude], 16, { duration: 0.8 })
    },
    (error) => {
      locating.value = false
      console.warn('Geolocation error:', error.message)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

watch([selectedAreas, minRating, searchQuery, activeCampus], () => {
  if (map) applyFilters()
})

onMounted(async () => {
  if (!mapContainer.value) return

  L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const MarkerClusterGroup = (await import('leaflet.markercluster')).default
  await import('leaflet.markercluster/dist/MarkerCluster.css')
  await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

  map = L.map(mapContainer.value, {
    zoomControl: false,
  }).setView([30.538, 114.367], 15)

  L.control.zoom({ position: 'topright' }).addTo(map)

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    maxZoom: 19,
  }).addTo(map)

  markerClusterGroup = new MarkerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster: any) => {
      const count = cluster.getChildCount()
      let size = 'small'
      if (count >= 50) size = 'large'
      else if (count >= 10) size = 'medium'
      return L.divIcon({
        html: `<div style="
          background:rgba(30,136,229,0.85);
          color:#fff;
          border-radius:50%;
          width:${size === 'large' ? 48 : size === 'medium' ? 40 : 32}px;
          height:${size === 'large' ? 48 : size === 'medium' ? 40 : 32}px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
          font-size:${size === 'large' ? 15 : size === 'medium' ? 14 : 13}px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          border:2px solid rgba(255,255,255,0.8);
        ">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(size === 'large' ? 48 : size === 'medium' ? 40 : 32, size === 'large' ? 48 : size === 'medium' ? 40 : 32),
      })
    },
  })
  map.addLayer(markerClusterGroup)

  await loadAreaGroups()

  const markers = await loadMarkers()

  if (markers.length > 0) {
    totalCount.value = markers.length

    const allKeys = [...new Set(markers.map(m => getAreaKey(m.area)))]
    selectedAreas.value = allKeys

    markers.forEach((item) => {
      const icon = createDivIcon(item.area, true)
      const marker = L.marker([item.lat, item.lng], { icon })
        .bindPopup(buildPopupContent(item), {
          maxWidth: 300,
          closeButton: true,
          className: 'whu-popup',
        })
      markerClusterGroup.addLayer(marker)
      allMarkerObjs.push({ marker, item })
    })

    if (allMarkerObjs.length > 0) {
      const group = L.latLngBounds(allMarkerObjs.map(e => [e.item.lat, e.item.lng]))
      map.fitBounds(group.pad(0.15))
    }
  }

  setTimeout(() => { if (map) map.invalidateSize() }, 100)
  setTimeout(() => { if (map) map.invalidateSize() }, 500)
  setTimeout(() => { if (map) map.invalidateSize() }, 1000)

  if (mapContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (map) map.invalidateSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.whu-map-wrapper {
  position: relative;
  width: 100%;
}

.whu-map {
  width: 100%;
  height: 700px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 0;
}

.whu-map-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
  font-size: 16px;
}

/* ---- Campus Filter Tabs ---- */
.campus-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 0;
  flex-wrap: wrap;
}

.campus-tab {
  padding: 6px 16px;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.campus-tab:hover {
  border-color: #aaa;
  background: #f8f8f8;
}

.campus-tab.active {
  color: #fff;
  border-color: transparent;
}

/* ---- Geolocation Button ---- */
.geo-btn {
  position: absolute;
  top: 12px;
  right: 108px;
  z-index: 1000;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  backdrop-filter: blur(6px);
}
.geo-btn:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

/* ---- Fit Button ---- */
.fit-btn {
  position: absolute;
  top: 12px;
  right: 60px;
  z-index: 1000;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s;
  backdrop-filter: blur(6px);
}
.fit-btn:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .whu-map {
    height: 500px;
  }

  .campus-tabs {
    gap: 4px;
    padding: 8px 0;
  }

  .campus-tab {
    padding: 5px 12px;
    font-size: 12px;
  }

  .geo-btn {
    top: 12px;
    right: 12px;
  }

  .fit-btn {
    top: 12px;
    right: 56px;
  }
}

/* ---- Leaflet popup overrides ---- */
:deep(.whu-popup .leaflet-popup-content-wrapper) {
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

:deep(.whu-popup .leaflet-popup-content) {
  margin: 12px 14px;
  line-height: 1.5;
}

:deep(.whu-popup .leaflet-popup-tip) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.custom-marker-icon) {
  background: none !important;
  border: none !important;
}

:deep(.custom-cluster-icon) {
  background: none !important;
  border: none !important;
}
</style>

<style>
/* Dark mode - non-scoped so html.dark selectors work */
html.dark .whu-map-wrapper .leaflet-tile-pane {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}

html.dark .whu-map-wrapper .leaflet-control-zoom a {
  background: #2a2a2a;
  color: #e0e0e0;
  border-color: #444;
}

html.dark .campus-tab {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

html.dark .campus-tab:hover {
  background: #333;
  border-color: #555;
}

html.dark .campus-tab.active {
  color: #fff;
}

html.dark .filter-panel {
  background: rgba(30, 30, 30, 0.97);
}

html.dark .panel-title {
  color: #e0e0e0;
}

html.dark .filter-label {
  color: #aaa;
}

html.dark .checkbox-item {
  color: #ccc;
}

html.dark .search-input {
  background: #2a2a2a;
  border-color: #444;
  color: #e0e0e0;
}

html.dark .search-results {
  background: #2a2a2a;
}

html.dark .search-result-item:hover {
  background: #333;
}

html.dark .result-name {
  color: #e0e0e0;
}

html.dark .map-legend {
  background: rgba(30, 30, 30, 0.95);
}

html.dark .legend-title {
  color: #ccc;
}

html.dark .legend-item {
  color: #bbb;
}

html.dark .geo-btn {
  background: rgba(30, 30, 30, 0.95);
  color: #e0e0e0;
}

html.dark .fit-btn {
  background: rgba(30, 30, 30, 0.95);
  color: #e0e0e0;
}

html.dark .rating-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

html.dark .rating-btn.active {
  background: #3a2a00;
  border-color: #f5a623;
  color: #ffa726;
}

html.dark .whu-popup .leaflet-popup-content-wrapper {
  background: #2a2a2a;
  color: #e0e0e0;
}

html.dark .reset-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}
</style>
