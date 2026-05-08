<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface MarkerItem {
  name: string
  location: string
  area: string
  rating: number
  avg_price: number
  tags: string[]
  recommendation: string
  lat: number
  lng: number
  image_url?: string
  review?: string
}

const props = defineProps<{
  filterFn: (item: MarkerItem) => boolean
  sortFn?: (a: MarkerItem, b: MarkerItem) => number
  title: string
  subtitle?: string
  emptyText?: string
  limit?: number
  showDateReason?: boolean
  showWarning?: boolean
}>()

const allMarkers = ref<MarkerItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'markers.json')
    if (res.ok) allMarkers.value = await res.json()
  } catch {}
  loading.value = false
})

const ranked = computed(() => {
  let list = allMarkers.value.filter(props.filterFn)
  if (props.sortFn) {
    list.sort(props.sortFn)
  } else {
    list.sort((a, b) => b.rating - a.rating || b.avg_price - a.avg_price)
  }
  if (props.limit) list = list.slice(0, props.limit)
  return list
})

function ratingStars(r: number) {
  return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))
}

function dateReason(item: MarkerItem): string {
  const reasons: string[] = []
  if (item.tags.includes('环境好')) reasons.push('环境优雅')
  if (item.tags.includes('适合聚餐')) reasons.push('适合聚餐')
  if (item.rating >= 4.5) reasons.push('口碑极佳')
  if (item.recommendation) reasons.push(`推荐：${item.recommendation.split('、').slice(0, 2).join('、')}`)
  return reasons.join(' · ') || '值得一试'
}

function rankClass(i: number) {
  if (i === 0) return 'rank-gold'
  if (i === 1) return 'rank-silver'
  if (i === 2) return 'rank-bronze'
  return ''
}
</script>

<template>
  <div class="ranking-wrapper">
    <div class="ranking-header">
      <h1 class="ranking-title">{{ title }}</h1>
      <p v-if="subtitle" class="ranking-subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>

    <div v-else-if="ranked.length === 0" class="empty-state">
      {{ emptyText || '暂无符合条件的餐厅' }}
    </div>

    <div v-else class="ranking-list">
      <div
        v-for="(item, idx) in ranked"
        :key="item.name + item.area"
        class="ranking-card"
      >
        <div class="rank-badge" :class="rankClass(idx)">
          {{ idx + 1 }}
        </div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-info">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-meta">
                <span class="area-tag">{{ item.area }}</span>
                <span class="rating-display">
                  <span class="stars">{{ ratingStars(item.rating) }}</span>
                  {{ item.rating.toFixed(1) }}
                </span>
                <span class="price-tag">¥{{ item.avg_price }}/人</span>
              </div>
            </div>
          </div>
          <div class="item-recommendation">
            <span class="rec-label">推荐：</span>{{ item.recommendation }}
          </div>
          <div v-if="item.tags.length" class="item-tags">
            <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
          </div>
          <div v-if="showDateReason" class="date-reason">
            💕 {{ dateReason(item) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWarning" class="warning-note">
      ⚠️ 温馨提示：评分仅供参考，每个人的口味不同~
    </div>
  </div>
</template>

<style scoped>
.ranking-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.ranking-header {
  margin-bottom: 32px;
}
.ranking-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}
.ranking-subtitle {
  color: var(--vp-c-text-2);
  margin: 8px 0 0;
  font-size: 15px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 48px;
  color: var(--vp-c-text-2);
  font-size: 15px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ranking-card {
  display: flex;
  gap: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.ranking-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.rank-badge {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}
.rank-gold { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #fff; }
.rank-silver { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #fff; }
.rank-bronze { background: linear-gradient(135deg, #cd7f32, #b06820); color: #fff; }

.card-body { flex: 1; min-width: 0; }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.item-name {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 13px;
}
.area-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
}
.rating-display { display: flex; align-items: center; gap: 4px; }
.stars { color: #f5a623; font-size: 14px; }
.price-tag { color: var(--vp-c-text-2); }

.item-recommendation {
  margin-top: 10px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.rec-label { font-weight: 600; color: var(--vp-c-text-1); }

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.date-reason {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(233, 30, 99, 0.06);
  border: 1px solid rgba(233, 30, 99, 0.15);
  font-size: 13px;
  color: #e91e63;
}

.warning-note {
  margin-top: 32px;
  padding: 16px;
  text-align: center;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.08);
  border: 1px solid rgba(255, 152, 0, 0.2);
  color: var(--vp-c-text-2);
  font-size: 14px;
}

@media (max-width: 768px) {
  .ranking-card { padding: 14px; }
  .rank-badge { width: 32px; height: 32px; font-size: 15px; }
  .item-name { font-size: 15px; }
  .item-meta { flex-wrap: wrap; gap: 8px; }
}
</style>
