<template>
  <div class="page-view">
    <div class="page-header"><h2>资产列表</h2></div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="资源类型" style="width: 140px" allowClear>
        <a-select-option value="server">服务器</a-select-option>
        <a-select-option value="database">数据库</a-select-option>
        <a-select-option value="network">网络设备</a-select-option>
      </a-select>
      <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear>
        <a-select-option value="running">运行中</a-select-option>
        <a-select-option value="stopped">已停止</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索名称/IP" style="width: 240px" />
    </div>
    <a-table :columns="columns" :data-source="assets" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'"><span><i class="fa-solid fa-server"></i> {{ getTypeText(record.type) }}</span></template>
        <template v-if="column.key === 'status'"><a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag></template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const filterType = ref(null)
const filterStatus = ref(null)
const search = ref('')
const assets = ref([
  { id: 1, name: 'web-server-001', ip: '10.0.2.10', type: 'server', status: 'running', region: '华北区域一' },
  { id: 2, name: 'db-primary', ip: '10.0.3.20', type: 'database', status: 'running', region: '华东区域一' },
])
const columns = [
  { title: '名称', dataIndex: 'name' }, { title: 'IP', dataIndex: 'ip' },
  { title: '类型', key: 'type' }, { title: '状态', key: 'status' },
  { title: '地域', dataIndex: 'region' },
]
const getTypeText = (t) => ({ server: '服务器', database: '数据库', network: '网络设备' }[t])
const getStatusColor = (s) => ({ running: 'green', stopped: 'red' }[s])
const getStatusText = (s) => ({ running: '运行中', stopped: '已停止' }[s])
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
</style>