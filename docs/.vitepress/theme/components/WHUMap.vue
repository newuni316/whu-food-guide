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
          @click="setCampusFilter(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Filter Panel -->
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
              v-model="searchQuery"
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
                <input type="checkbox" v-model="selectedAreas" :value="area.key" />
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
                @click="minRating = r"
              >
                {{ r === 0 ? '全部' : r + '⭐' }}
              </button>
            </div>
          </div>

          <!-- Count & Reset -->
          <div class="filter-footer">
            <span class="result-count">显示 {{ visibleCount }} / {{ totalCount }} 家</span>
            <button class="reset-btn" @click="resetFilters">重置</button>
          </div>
        </div>
      </div>

      <!-- Search Results Dropdown -->
      <div v-if="searchResults.length > 0 && searchQuery.length > 0" class="search-results">
        <div
          v-for="item in searchResults"
          :key="item.name"
          class="search-result-item"
          @click="focusMarker(item)"
        >
          <span class="result-dot" :style="{ background: getAreaColor(item.area) }"></span>
          <span class="result-name">{{ item.name }}</span>
          <span class="result-rating">{{ item.rating }}⭐</span>
        </div>
      </div>

      <!-- Map Container -->
      <div ref="mapContainer" class="whu-map"></div>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-title">图例</div>
        <div v-for="area in areaGroups" :key="area.key" class="legend-item">
          <span class="legend-dot" :style="{ background: area.color }"></span>
          <span>{{ area.label }}</span>
        </div>
      </div>

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let L: any = null
let markerClusterGroup: any = null
let allMarkerObjs: { marker: any; item: MarkerItem }[] = []
let resizeObserver: ResizeObserver | null = null
let userLocationMarker: any = null
let userLocationCircle: any = null

const searchQuery = ref('')
const selectedAreas = ref<string[]>([])
const minRating = ref(0)
const panelCollapsed = ref(false)
const totalCount = ref(0)
const activeCampus = ref('all')
const locating = ref(false)

interface MarkerItem {
  name: string
  lat: number
  lng: number
  rating: number
  tags: string[]
  location: string
  area: string
  campus: string
  avg_price?: number
  recommendation?: string
  image_url?: string
  feedback_url?: string
  admin_added?: boolean
  student_verified?: boolean
  address?: string
}

// --- Campus tabs ---
interface CampusTab {
  key: string
  label: string
  color: string
  campus: string[]
}

const campusTabs: CampusTab[] = [
  { key: 'all', label: '全部', color: '#1e88e5', campus: [] },
  { key: 'wenli', label: '文理学部', color: '#e53935', campus: ['wenli'] },
  { key: 'gongxue', label: '工学部', color: '#1e88e5', campus: ['gongxue'] },
  { key: 'xinxixue', label: '信息学部', color: '#43a047', campus: ['xinxixue'] },
  { key: 'yixue', label: '医学部', color: '#fb8c00', campus: ['yixue'] },
  { key: 'zhoubian', label: '周边商圈', color: '#8e24aa', campus: ['surroundings'] },
]

// --- Area color configuration ---
interface AreaGroup {
  key: string
  label: string
  color: string
  areas: string[]
}

const defaultAreaGroups: AreaGroup[] = [
  { key: 'wenli', label: '文理学部', color: '#e53935', areas: ['梅园', '桂园', '枫园', '樱园'] },
  { key: 'gongxue', label: '工学部', color: '#1e88e5', areas: ['工学部'] },
  { key: 'xinxi', label: '信息学部', color: '#43a047', areas: ['信息学部'] },
  { key: 'yixue', label: '医学部', color: '#fb8c00', areas: ['医学部'] },
  { key: 'zhoubian', label: '周边商圈', color: '#8e24aa', areas: ['广八路', '街道口'] },
]

const areaGroups = ref<AreaGroup[]>(defaultAreaGroups)

function getAreaColor(area: string): string {
  for (const group of areaGroups.value) {
    if (group.areas.includes(area)) return group.color
  }
  return '#757575'
}

function getAreaKey(area: string): string {
  for (const group of areaGroups.value) {
    if (group.areas.includes(area)) return group.key
  }
  return 'other'
}

function getCampusForArea(area: string): string {
  for (const group of areaGroups.value) {
    if (group.areas.includes(area)) return group.key
  }
  return 'other'
}

function getStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty)
}

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

  // Baidu Map navigation button
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

// --- Computed filters ---
const visibleCount = computed(() => {
  let count = 0
  for (const entry of allMarkerObjs) {
    const matchesCampus = activeCampus.value === 'all' || matchCampus(entry.item)
    const matchesArea = selectedAreas.value.length === 0 || selectedAreas.value.includes(getAreaKey(entry.item.area))
    const matchesRating = entry.item.rating >= minRating.value
    const matchesSearch = !searchQuery.value || entry.item.name.includes(searchQuery.value)
    if (matchesCampus && matchesArea && matchesRating && matchesSearch) count++
  }
  return count
})

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  return allMarkerObjs
    .map(e => e.item)
    .filter(item => {
      const matchesCampus = activeCampus.value === 'all' || matchCampus(item)
      return matchesCampus && item.name.toLowerCase().includes(q)
    })
    .slice(0, 8)
})

function matchCampus(item: MarkerItem): boolean {
  const tab = campusTabs.find(t => t.key === activeCampus.value)
  if (!tab || tab.campus.length === 0) return true
  // Match by campus field if available, otherwise derive from area
  const itemCampus = item.campus || getCampusForArea(item.area)
  return tab.campus.includes(itemCampus)
}

// --- Filter application ---
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

function resetFilters() {
  selectedAreas.value = []
  minRating.value = 0
  searchQuery.value = ''
  activeCampus.value = 'all'
}

function setCampusFilter(key: string) {
  activeCampus.value = key
  // Reset area checkboxes to show all within campus
  selectedAreas.value = []
  applyFilters()
}

function focusMarker(item: MarkerItem) {
  const entry = allMarkerObjs.find(e => e.item === item)
  if (!entry || !map) return
  searchQuery.value = ''
  // Ensure visible
  selectedAreas.value = [getAreaKey(item.area)]
  if (item.campus) {
    const matchingTab = campusTabs.find(t => t.campus.includes(item.campus))
    if (matchingTab) activeCampus.value = matchingTab.key
  }
  minRating.value = 0
  applyFilters()
  // Fly to and open popup
  map.flyTo([item.lat, item.lng], 17, { duration: 0.8 })
  setTimeout(() => entry.marker.openPopup(), 400)
}

function fitAllMarkers() {
  if (!map || allMarkerObjs.length === 0) return
  resetFilters()
  applyFilters()
  const group = L.latLngBounds(allMarkerObjs.map(e => [e.item.lat, e.item.lng]))
  map.fitBounds(group.pad(0.2))
}

// --- Geolocation ---
function locateUser() {
  if (!map || !navigator.geolocation) return
  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false
      const { latitude, longitude } = position.coords

      // Remove previous user location markers
      if (userLocationMarker) map.removeLayer(userLocationMarker)
      if (userLocationCircle) map.removeLayer(userLocationCircle)

      // Blue circle marker for user position
      userLocationMarker = L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: '#1e88e5',
        fillOpacity: 1,
        color: '#fff',
        weight: 3,
        opacity: 1,
      }).addTo(map).bindPopup('📍 我的位置')

      // Accuracy circle
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

// Watch filters
watch([selectedAreas, minRating, searchQuery], () => {
  if (map) applyFilters()
})

// --- Convert new format restaurant to MarkerItem ---
function convertNewFormat(item: any): MarkerItem {
  const avgRating = item.rating
    ? Math.round(((item.rating.taste + item.rating.environment + item.rating.value) / 3) * 10) / 10
    : 0
  return {
    name: item.name,
    lat: item.coordinates?.lat ?? item.lat,
    lng: item.coordinates?.lng ?? item.lng,
    rating: avgRating,
    tags: item.tags || [],
    location: item.location || item.area || '',
    area: item.area || '',
    campus: item.campus || '',
    avg_price: item.avg_price || (item.price_range ? Math.round((item.price_range[0] + item.price_range[1]) / 2) : undefined),
    recommendation: item.recommendation || (item.recommendations ? item.recommendations.join('、') : ''),
    image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : ''),
    feedback_url: item.feedback_url,
    admin_added: item.admin_added || false,
    student_verified: item.student_verified || false,
    address: item.address || '',
  }
}

// --- Lifecycle ---
onMounted(async () => {
  if (!mapContainer.value) return

  L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  // Import markercluster
  const MarkerClusterGroup = (await import('leaflet.markercluster')).default
  await import('leaflet.markercluster/dist/MarkerCluster.css')
  await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

  map = L.map(mapContainer.value, {
    zoomControl: false,
  }).setView([30.538, 114.367], 15)

  // Zoom control top-right
  L.control.zoom({ position: 'topright' }).addTo(map)

  const amapTileUrl = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
  const osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  const amapLayer = L.tileLayer(amapTileUrl, {
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    maxZoom: 19,
  })

  let errorCount = 0
  let osmAdded = false
  amapLayer.on('tileerror', () => {
    errorCount++
    if (errorCount > 3 && map && !osmAdded) {
      osmAdded = true
      map.removeLayer(amapLayer)
      L.tileLayer(osmTileUrl, {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
    }
  })
  amapLayer.addTo(map)

  // Initialize marker cluster group
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

  // Load areaGroups dynamically from areas.json
  try {
    const areasResp = await fetch(import.meta.env.BASE_URL + 'areas.json')
    const areasData = await areasResp.json()
    if (Array.isArray(areasData) && areasData.length > 0) {
      areaGroups.value = areasData
    }
  } catch {
    // use default areaGroups
  }

  // Load data: try new format first, fall back to markers.json
  let markers: MarkerItem[] = []
  try {
    const resp = await fetch(import.meta.env.BASE_URL + 'restaurants.json')
    const data = await resp.json()
    if (Array.isArray(data) && data.length > 0 && data[0].coordinates) {
      // New format
      markers = data.map(convertNewFormat)
    } else {
      // Old format from restaurants.json
      markers = data
    }
  } catch {
    try {
      const resp = await fetch(import.meta.env.BASE_URL + 'markers.json')
      markers = await resp.json()
    } catch (e) {
      console.error('Failed to load any marker data:', e)
    }
  }

  if (markers.length > 0) {
    totalCount.value = markers.length

    // Initialize all areas selected
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

    // Fit bounds initially
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

/* ---- Filter Panel ---- */
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

/* ---- Search Results Dropdown ---- */
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

/* ---- Legend ---- */
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

  .search-results {
    left: 12px;
    right: 12px;
    width: auto;
    bottom: 200px;
    top: auto;
  }

  .map-legend {
    bottom: auto;
    top: 12px;
    right: 12px;
    padding: 8px 10px;
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
