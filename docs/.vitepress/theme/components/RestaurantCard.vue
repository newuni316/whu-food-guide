<template>
  <div class="restaurant-card">
    <!-- Image -->
    <div class="card-image">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="restaurant.name"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="card-image-placeholder">
        <span>🍽️</span>
      </div>
    </div>

    <!-- Info -->
    <div class="card-info">
      <div class="card-header">
        <h3 class="card-name">{{ restaurant.name }}</h3>
        <div class="card-rating">
          <span class="stars">{{ stars }}</span>
          <span class="rating-num">{{ avgRating.toFixed(1) }}</span>
        </div>
      </div>

      <div class="card-meta">
        <span class="card-price">💰 ¥{{ restaurant.avg_price }}/人</span>
        <span class="card-area">📍 {{ restaurant.area }}</span>
      </div>

      <div class="card-tags">
        <span v-for="tag in displayTags" :key="tag" class="card-tag">{{ tag }}</span>
      </div>

      <div v-if="restaurant.address" class="card-address">
        <span class="addr-icon">🏠</span>
        <span class="addr-text">{{ restaurant.address }}</span>
      </div>

      <div v-if="restaurant.hours" class="card-hours">
        <span class="hours-icon">🕐</span>
        <span>{{ restaurant.hours }}</span>
      </div>

      <div v-if="restaurant.recommendations?.length" class="card-rec">
        <span class="rec-label">推荐：</span>
        <span>{{ restaurant.recommendations.join('、') }}</span>
      </div>

      <!-- Actions -->
      <div class="card-actions">
        <a
          :href="baiduMapUrl"
          target="_blank"
          rel="noopener"
          class="action-btn action-nav"
        >
          🧭 导航
        </a>
        <button class="action-btn action-copy" @click="copyAddress">
          📋 {{ copied ? '已复制' : '复制地址' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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
  restaurant: Restaurant
}>()

const imgError = ref(false)
const copied = ref(false)

const imageUrl = computed(() => {
  if (imgError.value) return ''
  // No image field in restaurants.json, use placeholder
  return ''
})

const avgRating = computed(() => {
  const r = props.restaurant.rating
  return (r.taste + r.environment + r.value) / 3
})

const stars = computed(() => {
  const full = Math.floor(avgRating.value)
  const half = avgRating.value % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty)
})

const displayTags = computed(() => {
  return [...props.restaurant.tags, ...props.restaurant.category].slice(0, 5)
})

const baiduMapUrl = computed(() => {
  const r = props.restaurant
  const name = encodeURIComponent(r.name)
  const addr = encodeURIComponent(r.address || r.name)
  return `https://api.map.baidu.com/marker?location=${r.coordinates.lat},${r.coordinates.lng}&title=${name}&content=${addr}&output=html&coord_type=gcj02`
})

function copyAddress() {
  const text = `${props.restaurant.name} - ${props.restaurant.address}`
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}
</script>

<style scoped>
.restaurant-card {
  display: flex;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
}
.restaurant-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Image */
.card-image {
  flex-shrink: 0;
  width: 200px;
  min-height: 180px;
  background: var(--vp-c-bg-alt, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-image-placeholder {
  font-size: 48px;
  opacity: 0.4;
}

/* Info */
.card-info {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.card-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-text-1, #1a1a1a);
  margin: 0;
  line-height: 1.3;
}
.card-rating {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.stars {
  color: #f5a623;
  font-size: 14px;
  letter-spacing: 1px;
}
.rating-num {
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1, #333);
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--vp-c-text-2, #666);
}
.card-price {
  color: #e65100;
  font-weight: 600;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.card-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  background: var(--vp-c-brand-soft, #e3f2fd);
  color: var(--vp-c-brand-1, #1565c0);
  border: 1px solid var(--vp-c-brand-1, #1e88e530);
  font-weight: 500;
}

.card-address,
.card-hours {
  font-size: 12px;
  color: var(--vp-c-text-3, #888);
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-rec {
  font-size: 12px;
  color: var(--vp-c-text-2, #555);
  line-height: 1.5;
}
.rec-label {
  color: var(--vp-c-text-3, #888);
}

/* Actions */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}
.action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
}
.action-nav {
  background: var(--vp-c-brand-1, #1e88e5);
  color: #fff;
}
.action-nav:hover {
  opacity: 0.9;
}
.action-copy {
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-2, #555);
  border: 1px solid var(--vp-c-divider, #ddd);
}
.action-copy:hover {
  background: var(--vp-c-bg-soft, #f5f5f5);
}

/* Mobile: vertical layout */
@media (max-width: 768px) {
  .restaurant-card {
    flex-direction: column;
  }
  .card-image {
    width: 100%;
    min-height: 160px;
    max-height: 200px;
  }
  .card-info {
    padding: 14px;
  }
}
</style>
