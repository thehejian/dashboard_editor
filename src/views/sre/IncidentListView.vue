<template>
  <div class="incident-list-view">
    <div class="page-header"><h3>故障列表</h3></div>

    <template v-if="loading">
      <a-spin style="display:block;margin:60px auto" />
    </template>

    <template v-else>
      <div class="il-stats-grid">
        <span class="il-stats-group-title" style="grid-column:span 3">级别分布</span>
        <span class="il-stats-group-title" style="grid-column:span 3">状态</span>
        <span class="il-stats-group-title" style="grid-column:span 1">今日新增</span>
        <div class="il-stat-card" v-for="s in severityStats" :key="s.label">
          <div class="il-stat-icon" :style="{ background: s.iconBg, color: s.iconColor }"><i :class="s.icon"></i></div>
          <div class="il-stat-info"><div class="il-stat-val">{{ s.value }}</div><div class="il-stat-label">{{ s.label }}</div></div>
        </div>
        <div class="il-stat-card" v-for="s in statusStats" :key="s.label">
          <div class="il-stat-icon" :style="{ background: s.iconBg, color: s.iconColor }"><i :class="s.icon"></i></div>
          <div class="il-stat-info"><div class="il-stat-val">{{ s.value }}</div><div class="il-stat-label">{{ s.label }}</div></div>
        </div>
        <div class="il-stat-card" v-for="s in todayStats" :key="s.label">
          <div class="il-stat-icon" :style="{ background: s.iconBg, color: s.iconColor }"><i :class="s.icon"></i></div>
          <div class="il-stat-info"><div class="il-stat-val">{{ s.value }}</div><div class="il-stat-label">{{ s.label }}</div></div>
        </div>
      </div>

      <div class="il-filter-bar">
        <a-select v-model:value="statusFilter" style="width:140px;flex-shrink:0" placeholder="状态筛选" allow-clear>
          <a-select-option value="healing">自愈中</a-select-option>
          <a-select-option value="resolved">已恢复</a-select-option>
          <a-select-option value="investigating">排查中</a-select-option>
        </a-select>
        <a-input-search v-model:value="searchQuery" placeholder="搜索故障名称或ID..." allow-clear class="il-search-wide" />
      </div>

      <a-table :data-source="filteredIncidents" :columns="incidentColumns" row-key="id" :pagination="{ pageSize: 15, showSizeChanger: true }" :scroll="{ y: 420 }" :custom-row="rowClickHandler">
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'severity'"><span class="il-severity" :style="{ color: severityColors[text] || '#666' }">{{ text }}</span></template>
          <template v-else-if="column.key === 'title'"><span class="il-clickable-title">{{ text }}</span></template>
          <template v-else-if="column.key === 'relatedAlerts'">
            <template v-if="(record.relatedAlertCount || 0) > 0">
              <a-tag color="orange" class="il-related-alert-tag" @click.stop="gotoRelatedAlerts(record)"><i class="fa-solid fa-bell"></i> {{ record.relatedAlertCount }}</a-tag>
            </template>
            <span v-else class="il-no-alert">—</span>
          </template>
          <template v-else-if="column.key === 'status'"><a-tag :color="statusTagMap[text]?.color || 'default'">{{ statusTagMap[text]?.label || text }}</a-tag></template>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const incidents = ref([])
const searchQuery = ref('')
const statusFilter = ref(undefined)

const severityColors = { P1: '#F5222D', P2: '#FF7D00', P3: '#FAAD14' }

const statusTagMap = {
  healing: { label: '自愈中', color: 'processing' },
  resolved: { label: '已恢复', color: 'success' },
  investigating: { label: '排查中', color: 'warning' },
}

const incidentColumns = [
  { title: '级别', dataIndex: 'severity', key: 'severity', width: 70 },
  { title: '故障ID', dataIndex: 'id', key: 'id', width: 140 },
  { title: '故障名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '应用', dataIndex: 'appName', key: 'appName', width: 100 },
  { title: '关联告警', key: 'relatedAlerts', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'P99', key: 'p99', width: 100, customRender: ({ record }) => `${record.metrics?.p99?.current || '-'}ms` },
  { title: '失败率', key: 'failRate', width: 80, customRender: ({ record }) => `${record.metrics?.failureRate?.current || '-'}%` },
]

const postmortemColumns = [
  { title: '报告标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '关联故障', dataIndex: 'incidentId', key: 'incidentId', width: 140 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
]

const statsBySeverity = computed(() => {
  const c = { P1: 0, P2: 0, P3: 0 }
  incidents.value.forEach(i => { if (c[i.severity] != null) c[i.severity]++ })
  return c
})

const statsByStatus = computed(() => {
  const c = { healing: 0, investigating: 0, resolved: 0 }
  incidents.value.forEach(i => { if (c[i.status] != null) c[i.status]++ })
  return c
})

const todayNewCount = computed(() => {
  const today = '2026-08-12'
  return incidents.value.filter(i => i.startTime?.startsWith(today)).length
})

const severityStats = computed(() => [
  { label: 'P1', value: statsBySeverity.value.P1, icon: 'fa-solid fa-circle-exclamation', iconBg: '#fff1f0', iconColor: '#cf1322' },
  { label: 'P2', value: statsBySeverity.value.P2, icon: 'fa-solid fa-triangle-exclamation', iconBg: '#fff7e6', iconColor: '#d46b08' },
  { label: 'P3', value: statsBySeverity.value.P3, icon: 'fa-solid fa-exclamation', iconBg: '#fffbe6', iconColor: '#d48806' },
])

const statusStats = computed(() => [
  { label: '自愈中', value: statsByStatus.value.healing, icon: 'fa-solid fa-heart-pulse', iconBg: '#e6f7ff', iconColor: '#096dd9' },
  { label: '排查中', value: statsByStatus.value.investigating, icon: 'fa-solid fa-magnifying-glass', iconBg: '#fff7e6', iconColor: '#d46b08' },
  { label: '已恢复', value: statsByStatus.value.resolved, icon: 'fa-solid fa-check-circle', iconBg: '#f6ffed', iconColor: '#389e0d' },
])

const todayStats = computed(() => [
  { label: '今日新增', value: todayNewCount.value, icon: 'fa-solid fa-calendar-plus', iconBg: '#e6f7ff', iconColor: '#096dd9' },
])

const filteredIncidents = computed(() => {
  let list = incidents.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(i => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    list = list.filter(i => i.status === statusFilter.value)
  }
  return list
})

function rowClickHandler(record) {
  return { onClick: () => router.push('/ops/incident/' + record.id), style: { cursor: 'pointer' } }
}

function gotoRelatedAlerts(record) {
  if (!record || !record.id) return
  router.push('/alarm/current?incidentId=' + record.id)
}

onMounted(async () => {
  try {
    const res = await fetch('/api/sre/incidents')
    const json = await res.json()
    if (json.success) incidents.value = json.data
  } catch (e) {
    console.error('Failed to load incidents:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.incident-list-view {
  padding: 24px;
}
.il-tabs-bar {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.il-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}
.il-tab:hover { color: #1a1a1a; }
.il-tab.active { color: #1890ff; border-bottom-color: #1890ff; font-weight: 600; }

.il-stats-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.il-stats-group-title {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  padding-left: 4px;
}
.il-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.il-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.il-stat-info {
  display: flex;
  flex-direction: column;
}
.il-stat-val {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.il-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.il-filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}
.il-search-wide {
  flex: 1;
  max-width: 100%;
}

.il-clickable-title {
  color: #1890ff;
  cursor: pointer;
}
.il-clickable-title:hover {
  color: #40a9ff;
}

.il-severity {
  font-weight: 700;
  font-size: 13px;
}

.il-related-alert-tag { cursor: pointer; }
.il-related-alert-tag:hover { opacity: 0.8; }
.il-no-alert { color: #bfbfbf; }
</style>