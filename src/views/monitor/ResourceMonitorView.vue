<template>
  <div class="page-view">
    <div class="page-header"><h2>资源监控</h2></div>

    <div class="resource-categories">
      <button class="cat-btn" :class="{ active: cat === 'all' }" @click="cat = 'all'">全部</button>
      <button class="cat-btn" :class="{ active: cat === 'app' }" @click="cat = 'app'">业务应用</button>
      <button class="cat-btn" :class="{ active: cat === 'cloud' }" @click="cat = 'cloud'">云服务</button>
      <button class="cat-btn" :class="{ active: cat === 'resource' }" @click="cat = 'resource'">云资源</button>
      <button class="cat-btn" :class="{ active: cat === 'physical' }" @click="cat = 'physical'">物理资源</button>
    </div>

    <div class="resource-filter">
      <a-input-search v-model:value="search" placeholder="搜索资源名称" style="width: 240px" />
      <a-select v-model:value="statusFilter" placeholder="状态" style="width: 120px" allowClear>
        <a-select-option value="正常">正常</a-select-option>
        <a-select-option value="警告">警告</a-select-option>
        <a-select-option value="异常">异常</a-select-option>
      </a-select>
    </div>

    <a-table :columns="columns" :data-source="filteredData" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ record.status }}</a-tag>
        </template>
        <template v-if="column.key === 'cpu'">
          <a-progress :percent="parseInt(record.cpu)" :showInfo="false" :strokeColor="getProgressColor(parseInt(record.cpu))" size="small" style="width: 80px" />
          <span style="margin-left: 8px">{{ record.cpu }}</span>
        </template>
        <template v-if="column.key === 'memory'">
          <a-progress :percent="parseInt(record.memory)" :showInfo="false" :strokeColor="getProgressColor(parseInt(record.memory))" size="small" style="width: 80px" />
          <span style="margin-left: 8px">{{ record.memory }}</span>
        </template>
        <template v-if="column.key === 'disk'">
          <a-progress :percent="parseInt(record.disk)" :showInfo="false" :strokeColor="getProgressColor(parseInt(record.disk))" size="small" style="width: 80px" />
          <span style="margin-left: 8px">{{ record.disk }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
          <a-button type="link" size="small" @click="viewChart(record)">监控图</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const cat = ref('all')
const search = ref('')
const statusFilter = ref(null)

const data = ref([
  { id: 1, name: 'web-cluster', category: 'app', type: '业务应用', status: '正常', cpu: '45', memory: '62', disk: '38', region: '华北区域一' },
  { id: 2, name: 'db-cluster', category: 'app', type: '业务应用', status: '警告', cpu: '72', memory: '85', disk: '55', region: '华东区域一' },
  { id: 3, name: 'redis-cache', category: 'cloud', type: '云服务', status: '正常', cpu: '25', memory: '45', disk: '20', region: '华北区域一' },
  { id: 4, name: 'vm-001', category: 'resource', type: '云资源', status: '正常', cpu: '15', memory: '30', disk: '40', region: '华南区域一' },
  { id: 5, name: 'physical-server-01', category: 'physical', type: '物理资源', status: '异常', cpu: '98', memory: '92', disk: '75', region: '华北区域一' },
  { id: 6, name: 'k8s-master-01', category: 'cloud', type: '云服务', status: '正常', cpu: '35', memory: '55', disk: '42', region: '华东区域一' },
  { id: 7, name: 'api-gateway', category: 'app', type: '业务应用', status: '正常', cpu: '28', memory: '40', disk: '15', region: '华北区域一' },
  { id: 8, name: 'oss-bucket', category: 'cloud', type: '云服务', status: '正常', cpu: '5', memory: '10', disk: '60', region: '华南区域一' },
])

const columns = [
  { title: '资源名称', dataIndex: 'name', width: 150 },
  { title: '类型', dataIndex: 'type', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: 'CPU', key: 'cpu', width: 180 },
  { title: '内存', key: 'memory', width: 180 },
  { title: '磁盘', key: 'disk', width: 180 },
  { title: '区域', dataIndex: 'region', width: 120 },
  { title: '操作', key: 'action', width: 140 },
]

const catMap = { all: '', app: 'app', cloud: 'cloud', resource: 'resource', physical: 'physical' }

const filteredData = computed(() => {
  return data.value.filter(item => {
    if (cat.value !== 'all' && item.category !== catMap[cat.value]) return false
    if (search.value && !item.name.includes(search.value)) return false
    if (statusFilter.value && item.status !== statusFilter.value) return false
    return true
  })
})

const getStatusColor = (status) => ({ 正常: 'green', 警告: 'orange', 异常: 'red' }[status])
const getProgressColor = (value) => {
  if (value >= 90) return '#f5222d'
  if (value >= 80) return '#fa8c16'
  return '#52c41a'
}
const viewDetail = (record) => { console.log('查看详情', record) }
const viewChart = (record) => { console.log('查看监控图', record) }
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.resource-categories { display: flex; gap: 8px; margin-bottom: 16px; }
.cat-btn { padding: 8px 16px; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.15s; }
.cat-btn:hover { border-color: var(--brand); }
.cat-btn.active { background: var(--brand); color: #fff; border-color: var(--brand); }
.resource-filter { display: flex; gap: 12px; margin-bottom: 16px; }
</style>