import { ref, computed, watch, type Ref } from 'vue'

export interface MarkerItem {
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

export interface AreaGroup {
  key: string
  label: string
  color: string
  areas: string[]
}

export interface CampusTab {
  key: string
  label: string
  color: string
  campus: string[]
}

const defaultAreaGroups: AreaGroup[] = [
  { key: 'wenli', label: '文理学部', color: '#e53935', areas: ['梅园', '桂园', '枫园', '樱园'] },
  { key: 'gongxue', label: '工学部', color: '#1e88e5', areas: ['工学部'] },
  { key: 'xinxi', label: '信息学部', color: '#43a047', areas: ['信息学部'] },
  { key: 'yixue', label: '医学部', color: '#fb8c00', areas: ['医学部'] },
  { key: 'zhoubian', label: '周边商圈', color: '#8e24aa', areas: ['广八路', '街道口'] },
]

export const campusTabs: CampusTab[] = [
  { key: 'all', label: '全部', color: '#1e88e5', campus: [] },
  { key: 'wenli', label: '文理学部', color: '#e53935', campus: ['wenli'] },
  { key: 'gongxue', label: '工学部', color: '#1e88e5', campus: ['gongxue'] },
  { key: 'xinxixue', label: '信息学部', color: '#43a047', campus: ['xinxixue'] },
  { key: 'yixue', label: '医学部', color: '#fb8c00', campus: ['yixue'] },
  { key: 'zhoubian', label: '周边商圈', color: '#8e24aa', campus: ['surroundings'] },
]

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

export function useMapMarkers() {
  const areaGroups = ref<AreaGroup[]>(defaultAreaGroups)
  const allMarkerObjs: { marker: any; item: MarkerItem }[] = []
  const searchQuery = ref('')
  const selectedAreas = ref<string[]>([])
  const minRating = ref(0)
  const activeCampus = ref('all')
  const totalCount = ref(0)

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

  function matchCampus(item: MarkerItem): boolean {
    const tab = campusTabs.find(t => t.key === activeCampus.value)
    if (!tab || tab.campus.length === 0) return true
    const itemCampus = item.campus || getCampusForArea(item.area)
    return tab.campus.includes(itemCampus)
  }

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

  async function loadMarkers(): Promise<MarkerItem[]> {
    let markers: MarkerItem[] = []
    try {
      const resp = await fetch(import.meta.env.BASE_URL + 'restaurants.json')
      const data = await resp.json()
      if (Array.isArray(data) && data.length > 0 && data[0].coordinates) {
        markers = data.map(convertNewFormat)
      } else {
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
    return markers
  }

  async function loadAreaGroups(): Promise<void> {
    try {
      const areasResp = await fetch(import.meta.env.BASE_URL + 'areas.json')
      const areasData = await areasResp.json()
      if (Array.isArray(areasData) && areasData.length > 0) {
        areaGroups.value = areasData
      }
    } catch {
      // use default areaGroups
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
    selectedAreas.value = []
  }

  return {
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
    getCampusForArea,
    getStars,
    matchCampus,
    loadMarkers,
    loadAreaGroups,
    resetFilters,
    setCampusFilter,
    convertNewFormat,
  }
}
