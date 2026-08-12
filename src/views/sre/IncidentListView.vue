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
      <div class="il-filter-bar">
        <a-input-search v-model:value="searchQuery" placeholder="搜索故障ID或标题..." style="width:320px" allow-clear />
        <a-select v-model:value="statusFilter" style="width:140px" placeholder="状态筛选" allow-clear>
          <a-select-option value="healing">自愈中</a-select-option>
          <a-select-option value="resolved">已恢复</a-select-option>
          <a-select-option value="investigating">排查中</a-select-option>
        </a-select>
      </div>

      <a-table :data-source="filteredIncidents" :columns="incidentColumns" row-key="id" :pagination="{ pageSize: 15, showSizeChanger: true }" :scroll="{ y: 420 }" :custom-row="rowClickHandler">
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'severity'">
            <span :style="{ color: severityColors[text] || '#666', fontWeight: 600 }">{{ text }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusTagMap[text]?.color || 'default'">{{ statusTagMap[text]?.label || text }}</a-tag>
          </template>
        </template>
      </a-table>
    </template>

    <template v-else>
      <a-table :data-source="postmortems" :columns="postmortemColumns" row-key="id" :pagination="{ pageSize: 15, showSizeChanger: true }" :scroll="{ y: 420 }" :custom-row="postmortemRowClickHandler" />
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
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
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
.il-filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
</style>