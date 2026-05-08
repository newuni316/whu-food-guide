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

const PASSWORD = 'whufood2024'
const authenticated = ref(false)
const passwordInput = ref('')
const passwordError = ref(false)

const markers = ref<MarkerItem[]>([])
const filterArea = ref('')
const sortField = ref<'rating' | 'avg_price' | 'name'>('rating')
const sortDir = ref<'desc' | 'asc'>('desc')

// Edit state
const editingIndex = ref<number | null>(null)
const showAddForm = ref(false)
const formData = ref<MarkerItem>({
  name: '', location: '', area: '', rating: 4, avg_price: 0,
  tags: [], recommendation: '', lat: 30.538, lng: 114.367, image_url: '', review: ''
})
const tagInput = ref('')

const areas = computed(() => {
  const set = new Set(markers.value.map(m => m.area))
  return Array.from(set).sort()
})

const filtered = computed(() => {
  let list = [...markers.value]
  if (filterArea.value) list = list.filter(m => m.area === filterArea.value)
  list.sort((a, b) => {
    const dir = sortDir.value === 'desc' ? -1 : 1
    if (sortField.value === 'name') return dir * a.name.localeCompare(b.name, 'zh')
    return dir * (a[sortField.value] - b[sortField.value])
  })
  return list
})

const stats = computed(() => {
  const total = markers.value.length
  if (total === 0) return { total: 0, avgRating: 0, avgPrice: 0, areaDist: {} as Record<string, number> }
  const avgRating = +(markers.value.reduce((s, m) => s + m.rating, 0) / total).toFixed(1)
  const avgPrice = +(markers.value.reduce((s, m) => s + m.avg_price, 0) / total).toFixed(1)
  const areaDist: Record<string, number> = {}
  markers.value.forEach(m => { areaDist[m.area] = (areaDist[m.area] || 0) + 1 })
  return { total, avgRating, avgPrice, areaDist }
})

const maxAreaCount = computed(() => Math.max(1, ...Object.values(stats.value.areaDist)))

function login() {
  if (passwordInput.value === PASSWORD) {
    authenticated.value = true
    passwordError.value = false
    loadData()
  } else {
    passwordError.value = true
  }
}

async function loadData() {
  try {
    const res = await fetch('/markers.json')
    if (res.ok) markers.value = await res.json()
  } catch {}
  // Override with localStorage if exists
  const saved = localStorage.getItem('whufood_markers')
  if (saved) {
    try { markers.value = JSON.parse(saved) } catch {}
  }
}

function saveToStorage() {
  localStorage.setItem('whufood_markers', JSON.stringify(markers.value))
}

function resetForm() {
  formData.value = {
    name: '', location: '', area: '', rating: 4, avg_price: 0,
    tags: [], recommendation: '', lat: 30.538, lng: 114.367, image_url: '', review: ''
  }
  tagInput.value = ''
}

function startAdd() {
  resetForm()
  editingIndex.value = null
  showAddForm.value = true
}

function startEdit(index: number) {
  const m = filtered.value[index]
  formData.value = { ...m, tags: [...m.tags], image_url: m.image_url || '', review: m.review || '' }
  tagInput.value = m.tags.join(', ')
  editingIndex.value = index
  showAddForm.value = true
}

function cancelForm() {
  showAddForm.value = false
  editingIndex.value = null
  resetForm()
}

function addTagFromInput() {
  formData.value.tags = tagInput.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)
}

function saveForm() {
  addTagFromInput()
  if (!formData.value.name || !formData.value.area) return

  if (editingIndex.value !== null) {
    const realItem = filtered.value[editingIndex.value]
    const realIndex = markers.value.findIndex(m => m === realItem)
    if (realIndex >= 0) markers.value[realIndex] = { ...formData.value }
  } else {
    markers.value.push({ ...formData.value })
  }
  saveToStorage()
  showAddForm.value = false
  editingIndex.value = null
  resetForm()
}

function deleteItem(index: number) {
  const item = filtered.value[index]
  if (!confirm(`确定删除「${item.name}」吗？`)) return
  const realIndex = markers.value.findIndex(m => m === item)
  if (realIndex >= 0) markers.value.splice(realIndex, 1)
  saveToStorage()
}

function toggleSort(field: 'rating' | 'avg_price' | 'name') {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
}

function sortIcon(field: string) {
  if (sortField.value !== field) return '↕'
  return sortDir.value === 'desc' ? '↓' : '↑'
}

function exportCSV() {
  const header = 'store_name,location,area,rating,tags,recommendation,review,avg_price,coordinates\n'
  const rows = markers.value.map(m => {
    const coords = `${m.lat}/${m.lng}`
    const tags = m.tags.join(',')
    const review = (m.review || '').replace(/"/g, '""')
    const rec = m.recommendation.replace(/"/g, '""')
    return `"${m.name}","${m.location}","${m.area}",${m.rating},"${tags}","${rec}","${review}",${m.avg_price},"${coords}"`
  }).join('\n')
  downloadFile(header + rows, 'mock_survey_data.csv', 'text/csv')
}

function exportJSON() {
  downloadFile(JSON.stringify(markers.value, null, 2), 'markers.json', 'application/json')
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ratingStars(r: number) {
  return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))
}
</script>

<template>
  <div class="admin-panel">
    <!-- Login -->
    <div v-if="!authenticated" class="login-box">
      <div class="login-card">
        <h2>🔐 管理后台</h2>
        <p>请输入管理密码</p>
        <div class="login-form">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="密码"
            class="login-input"
            :class="{ 'input-error': passwordError }"
            @keyup.enter="login"
          />
          <button class="btn btn-primary" @click="login">登录</button>
        </div>
        <p v-if="passwordError" class="error-text">密码错误，请重试</p>
      </div>
    </div>

    <!-- Main Panel -->
    <div v-else>
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">餐厅总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.avgRating }}</div>
          <div class="stat-label">平均评分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">¥{{ stats.avgPrice }}</div>
          <div class="stat-label">平均人均</div>
        </div>
      </div>

      <!-- Area Distribution -->
      <div class="section">
        <h3>区域分布</h3>
        <div class="area-chart">
          <div v-for="(count, area) in stats.areaDist" :key="area" class="bar-row">
            <span class="bar-label">{{ area }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (count / maxAreaCount * 100) + '%' }"></div>
            </div>
            <span class="bar-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <select v-model="filterArea" class="filter-select">
            <option value="">全部区域</option>
            <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
          </select>
          <span class="result-count">共 {{ filtered.length }} 条</span>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-success" @click="startAdd">+ 新增</button>
          <button class="btn btn-outline" @click="exportCSV">导出 CSV</button>
          <button class="btn btn-outline" @click="exportJSON">导出 markers.json</button>
        </div>
      </div>

      <!-- Add/Edit Form -->
      <div v-if="showAddForm" class="form-card">
        <h3>{{ editingIndex !== null ? '编辑餐厅' : '新增餐厅' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>名称 *</label>
            <input v-model="formData.name" class="form-input" placeholder="餐厅名称" />
          </div>
          <div class="form-group">
            <label>区域 *</label>
            <input v-model="formData.area" class="form-input" placeholder="如：梅园、桂园" />
          </div>
          <div class="form-group">
            <label>位置</label>
            <input v-model="formData.location" class="form-input" placeholder="如：文理学部-梅园" />
          </div>
          <div class="form-group">
            <label>评分 (1-5)</label>
            <input v-model.number="formData.rating" type="number" min="1" max="5" step="0.5" class="form-input" />
          </div>
          <div class="form-group">
            <label>人均消费 (元)</label>
            <input v-model.number="formData.avg_price" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>标签 (逗号分隔)</label>
            <input v-model="tagInput" class="form-input" placeholder="性价比高,量大实惠" @input="addTagFromInput" />
          </div>
          <div class="form-group full-width">
            <label>推荐菜品</label>
            <input v-model="formData.recommendation" class="form-input" placeholder="菜品1、菜品2" />
          </div>
          <div class="form-group full-width">
            <label>评价</label>
            <textarea v-model="formData.review" class="form-input form-textarea" placeholder="用餐体验..."></textarea>
          </div>
          <div class="form-group">
            <label>纬度 (lat)</label>
            <input v-model.number="formData.lat" type="number" step="0.0001" class="form-input" />
          </div>
          <div class="form-group">
            <label>经度 (lng)</label>
            <input v-model.number="formData.lng" type="number" step="0.0001" class="form-input" />
          </div>
          <div class="form-group full-width">
            <label>图片 URL (可选)</label>
            <input v-model="formData.image_url" class="form-input" placeholder="https://..." />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveForm">保存</button>
          <button class="btn btn-outline" @click="cancelForm">取消</button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('name')">名称 {{ sortIcon('name') }}</th>
              <th>区域</th>
              <th class="sortable" @click="toggleSort('rating')">评分 {{ sortIcon('rating') }}</th>
              <th class="sortable" @click="toggleSort('avg_price')">人均 {{ sortIcon('avg_price') }}</th>
              <th>标签</th>
              <th>推荐菜品</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filtered" :key="item.name + item.area" class="table-row">
              <td class="name-cell">
                <div class="name-text">{{ item.name }}</div>
                <div class="location-text">{{ item.location }}</div>
              </td>
              <td><span class="area-badge">{{ item.area }}</span></td>
              <td><span class="rating-stars">{{ ratingStars(item.rating) }}</span> {{ item.rating }}</td>
              <td>¥{{ item.avg_price }}</td>
              <td>
                <div class="tags-cell">
                  <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
                </div>
              </td>
              <td class="rec-cell">{{ item.recommendation }}</td>
              <td class="action-cell">
                <button class="btn-icon" title="编辑" @click="startEdit(idx)">✏️</button>
                <button class="btn-icon" title="删除" @click="deleteItem(idx)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}

/* Login */
.login-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.login-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  min-width: 320px;
}
.login-card h2 { margin: 0 0 8px; }
.login-card p { color: var(--vp-c-text-2); margin: 0 0 24px; }
.login-form { display: flex; gap: 8px; }
.login-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  outline: none;
}
.login-input:focus { border-color: var(--vp-c-brand-1); }
.input-error { border-color: #e53935; }
.error-text { color: #e53935; font-size: 13px; margin-top: 8px; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.stat-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-top: 4px;
}

/* Area Chart */
.section { margin-bottom: 24px; }
.section h3 { margin: 0 0 12px; font-size: 16px; }
.area-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 80px; font-size: 13px; text-align: right; color: var(--vp-c-text-2); }
.bar-track {
  flex: 1;
  height: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  border-radius: 4px;
  transition: width 0.3s;
}
.bar-count { width: 24px; font-size: 13px; font-weight: 600; }

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}
.result-count { font-size: 13px; color: var(--vp-c-text-2); }

/* Buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-primary { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.btn-primary:hover { opacity: 0.9; }
.btn-success { background: #43a047; color: #fff; border-color: #43a047; }
.btn-success:hover { opacity: 0.9; }
.btn-outline { background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.btn-outline:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

/* Form */
.form-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 16px;
}
.form-card h3 { margin: 0 0 16px; font-size: 16px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 12px; font-weight: 600; color: var(--vp-c-text-2); }
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
}
.form-input:focus { border-color: var(--vp-c-brand-1); }
.form-textarea { min-height: 60px; resize: vertical; }
.form-actions { display: flex; gap: 8px; margin-top: 16px; }

/* Table */
.table-wrapper { overflow-x: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th {
  background: var(--vp-c-bg-soft);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--vp-c-divider);
  white-space: nowrap;
}
.data-table th.sortable { cursor: pointer; user-select: none; }
.data-table th.sortable:hover { color: var(--vp-c-brand-1); }
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: top;
}
.table-row:hover { background: var(--vp-c-bg-soft); }
.name-cell .name-text { font-weight: 600; }
.name-cell .location-text { font-size: 11px; color: var(--vp-c-text-3); margin-top: 2px; }
.area-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
}
.rating-stars { color: #f5a623; font-size: 12px; }
.tags-cell { display: flex; flex-wrap: wrap; gap: 4px; }
.tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
}
.rec-cell { max-width: 200px; font-size: 12px; color: var(--vp-c-text-2); }
.action-cell { white-space: nowrap; }
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
}
.btn-icon:hover { background: var(--vp-c-default-soft); }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-left, .toolbar-right { justify-content: flex-start; flex-wrap: wrap; }
}
</style>
