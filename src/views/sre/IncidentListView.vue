<template>
  <div class="incident-list-view">
    <div class="page-header"><h3>故障中心</h3></div>

    <div class="il-tabs-bar">
      <button class="il-tab" :class="{ active: activeTab === 'incidents' }" @click="activeTab = 'incidents'">
        <i class="fa-solid fa-list"></i> 故障列表 ({{ incidents.length }})
      </button>
      <button class="il-tab" :class="{ active: activeTab === 'postmortems' }" @click="activeTab = 'postmortems'">
        <i class="fa-solid fa-file-lines"></i> 复盘记录 ({{ postmortems.length }})
      </button>
    </div>

    <template v-if="loading">
      <a-spin style="display:block;margin:60px auto" />
    </template>

    <template v-else-if="activeTab === 'incidents'">
      <div class="il-stats-bar">
        <div class="il-stats-group">
          <span class="il-stats-label">级别分布</span>
          <span class="il-stats-item"><span class="il-dot" style="background:#F5222D"></span>P1 <em>{{ statsBySeverity.P1 }}</em></span>
          <span class="il-stats-item"><span class="il-dot" style="background:#FF7D00"></span>P2 <em>{{ statsBySeverity.P2 }}</em></span>
          <span class="il-stats-item"><span class="il-dot" style="background:#FAAD14"></span>P3 <em>{{ statsBySeverity.P3 }}</em></span>
        </div>
        <div class="il-stats-group">
          <span class="il-stats-label">状态</span>
          <span class="il-stats-item">自愈中 <em>{{ statsByStatus.healing }}</em></span>
          <span class="il-stats-item">排查中 <em>{{ statsByStatus.investigating }}</em></span>
          <span class="il-stats-item">已恢复 <em>{{ statsByStatus.resolved }}</em></span>
        </div>
        <div class="il-stats-group">
          <span class="il-stats-label">今日新增</span>
          <span class="il-stats-item il-stats-highlight">{{ todayNewCount }}</span>
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
          <template v-if="column.key === 'severity'">
            <span class="il-severity" :style="{ color: severityColors[text] || '#666' }">{{ text }}</span>
          </template>
          <template v-else-if="column.key === 'title'">
            <span class="il-clickable-title">{{ text }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusTagMap[text]?.color || 'default'">{{ statusTagMap[text]?.label || text }}</a-tag>
          </template>
        </template>
      </a-table>
    </template>

    <template v-else>
      <div class="il-stats-bar">
        <div class="il-stats-group">
          <span class="il-stats-label">复盘报告</span>
          <span class="il-stats-item">已归档 <em>{{ postmortems.length }}</em></span>
        </div>
        <div class="il-stats-group">
          <span class="il-stats-label">关联故障级别</span>
          <span class="il-stats-item"><span class="il-dot" style="background:#F5222D"></span>P1 <em>{{ pmStatsBySeverity.P1 }}</em></span>
          <span class="il-stats-item"><span class="il-dot" style="background:#FF7D00"></span>P2 <em>{{ pmStatsBySeverity.P2 }}</em></span>
          <span class="il-stats-item"><span class="il-dot" style="background:#FAAD14"></span>P3 <em>{{ pmStatsBySeverity.P3 }}</em></span>
        </div>
      </div>

      <div class="il-filter-bar">
        <a-input-search v-model:value="pmSearchQuery" placeholder="搜索报告标题..." allow-clear class="il-search-wide" />
      </div>

      <a-table :data-source="filteredPostmortems" :columns="postmortemColumns" row-key="id" :pagination="{ pageSize: 15, showSizeChanger: true }" :scroll="{ y: 420 }" :custom-row="postmortemRowClickHandler">
        <template #bodyCell="{ column, text }">
          <template v-if="column.key === 'title'">
            <span class="il-clickable-title">{{ text }}</span>
          </template>
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
const activeTab = ref('incidents')
const incidents = ref([])
const postmortems = ref([])
const searchQuery = ref('')
const pmSearchQuery = ref('')
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

const pmStatsBySeverity = computed(() => {
  const c = { P1: 0, P2: 0, P3: 0 }
  postmortems.value.forEach(pm => {
    const s = pm.severity
    if (c[s] != null) c[s]++
  })
  return c
})

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

const filteredPostmortems = computed(() => {
  if (!pmSearchQuery.value) return postmortems.value
  const q = pmSearchQuery.value.toLowerCase()
  return postmortems.value.filter(pm => pm.title.toLowerCase().includes(q) || pm.incidentId.toLowerCase().includes(q))
})

function rowClickHandler(record) {
  return { onClick: () => router.push('/ops/incident/' + record.id), style: { cursor: 'pointer' } }
}

function postmortemRowClickHandler(record) {
  return { onClick: () => router.push('/ops/incident/' + record.incidentId + '?tab=postmortem'), style: { cursor: 'pointer' } }
}

onMounted(async () => {
  try {
    const [incRes, pmRes] = await Promise.all([
      fetch('/api/sre/incidents'),
      fetch('/api/sre/postmortems'),
    ])
    const incJson = await incRes.json()
    const pmJson = await pmRes.json()
    if (incJson.success) incidents.value = incJson.data
    if (pmJson.success) postmortems.value = pmJson.data
  } catch (e) {
    console.error('Failed to load incident list:', e)
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

.il-stats-bar {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
}
.il-stats-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.il-stats-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}
.il-stats-item {
  font-size: 13px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 4px;
}
.il-stats-item em {
  font-style: normal;
  font-weight: 700;
  color: #262626;
  margin-left: 2px;
}
.il-stats-highlight {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}
.il-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
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
</style>