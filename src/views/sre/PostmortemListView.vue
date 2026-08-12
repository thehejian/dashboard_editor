<template>
  <div class="page-view">
    <div class="page-header"><h3>复盘记录</h3></div>
    <div v-if="loading" style="text-align:center;margin:60px 0"><a-spin /></div>
    <template v-else>
      <div class="il-stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
        <span class="il-stats-group-title" style="grid-column:span 1">复盘报告</span>
        <span class="il-stats-group-title" style="grid-column:span 3">关联故障级别</span>
        <div class="il-stat-card" v-for="s in pmCountStats" :key="s.label">
          <div class="il-stat-icon" :style="{ background: s.iconBg, color: s.iconColor }"><i :class="s.icon"></i></div>
          <div class="il-stat-info"><div class="il-stat-val">{{ s.value }}</div><div class="il-stat-label">{{ s.label }}</div></div>
        </div>
        <div class="il-stat-card" v-for="s in pmSevStats" :key="s.label">
          <div class="il-stat-icon" :style="{ background: s.iconBg, color: s.iconColor }"><i :class="s.icon"></i></div>
          <div class="il-stat-info"><div class="il-stat-val">{{ s.value }}</div><div class="il-stat-label">{{ s.label }}</div></div>
        </div>
      </div>
      <div class="il-filter-bar"><a-input-search v-model:value="searchQuery" placeholder="搜索报告标题..." allow-clear class="il-search-wide" /></div>
      <a-table :data-source="filteredPostmortems" :columns="columns" row-key="id" :pagination="{ pageSize: 15, showSizeChanger: true }" :scroll="{ y: 420 }" :custom-row="r => ({ onClick: () => router.push('/ops/incident/' + r.incidentId + '?tab=postmortem'), style: { cursor: 'pointer' } })">
        <template #bodyCell="{ column, text }"><template v-if="column.key === 'title'"><span class="il-clickable-title">{{ text }}</span></template></template>
      </a-table>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const loading = ref(true)
const postmortems = ref([])
const searchQuery = ref('')
const columns = [
  { title: '报告标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '关联故障', dataIndex: 'incidentId', key: 'incidentId', width: 140 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
]
const pmCountStats = computed(() => [
  { label: '已归档', value: postmortems.value.length, icon: 'fa-solid fa-file-lines', iconBg: '#f6ffed', iconColor: '#389e0d' },
])
const pmSevStats = computed(() => {
  const c = { P1: 0, P2: 0, P3: 0 }
  postmortems.value.forEach(pm => { if (c[pm.severity] != null) c[pm.severity]++ })
  return [
    { label: 'P1', value: c.P1, icon: 'fa-solid fa-circle-exclamation', iconBg: '#fff1f0', iconColor: '#cf1322' },
    { label: 'P2', value: c.P2, icon: 'fa-solid fa-triangle-exclamation', iconBg: '#fff7e6', iconColor: '#d46b08' },
    { label: 'P3', value: c.P3, icon: 'fa-solid fa-exclamation', iconBg: '#fffbe6', iconColor: '#d48806' },
  ]
})
const filteredPostmortems = computed(() => {
  if (!searchQuery.value) return postmortems.value
  const q = searchQuery.value.toLowerCase()
  return postmortems.value.filter(pm => pm.title.toLowerCase().includes(q) || pm.incidentId.toLowerCase().includes(q))
})
onMounted(async () => {
  try {
    const res = await fetch('/api/sre/postmortems')
    const json = await res.json()
    if (json.success) postmortems.value = json.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.il-stats-grid { display:grid;gap:8px; }
.il-stats-group-title { font-size:12px;color:#8c8c8c;font-weight:500;padding-left:4px; }
.il-stat-card { display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.05); }
.il-stat-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0; }
.il-stat-info { display:flex;flex-direction:column; }
.il-stat-val { font-size:22px;font-weight:700;line-height:1.2; }
.il-stat-label { font-size:12px;color:#6B7280; }
.il-filter-bar { display:flex;gap:8px;margin-bottom:12px; }
.il-search-wide { flex:1; }
.il-clickable-title { color:#1890ff;cursor:pointer; }
.il-clickable-title:hover { color:#40a9ff; }
</style>