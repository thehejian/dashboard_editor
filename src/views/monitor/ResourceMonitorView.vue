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
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'"><a-tag :color="record.status === '正常' ? 'green' : 'red'">{{ record.status }}</a-tag></template>
        <template v-if="column.key === 'action'"><a-button type="link" size="small">详情</a-button></template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cat = ref('all')
const data = ref([
  { id: 1, name: 'web-cluster', type: '业务应用', status: '正常', cpu: '45%', memory: '62%', disk: '38%', region: '华北区域一' },
  { id: 2, name: 'db-cluster', type: '业务应用', status: '正常', cpu: '72%', memory: '85%', disk: '55%', region: '华东区域一' },
  { id: 3, name: 'redis-cache', type: '云服务', status: '正常', cpu: '25%', memory: '45%', disk: '20%', region: '华北区域一' },
  { id: 4, name: 'vm-001', type: '云资源', status: '正常', cpu: '15%', memory: '30%', disk: '40%', region: '华南区域一' },
  { id: 5, name: 'physical-server-01', type: '物理资源', status: '警告', cpu: '88%', memory: '92%', disk: '75%', region: '华北区域一' },
])
const columns = [
  { title: '资源名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' },
  { title: '状态', key: 'status' }, { title: 'CPU', dataIndex: 'cpu' },
  { title: '内存', dataIndex: 'memory' }, { title: '磁盘', dataIndex: 'disk' },
  { title: '区域', dataIndex: 'region' }, { title: '操作', key: 'action' },
]
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.resource-categories { display: flex; gap: 8px; margin-bottom: 20px; }
.cat-btn { padding: 8px 16px; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; cursor: pointer; font-size: 14px; }
.cat-btn:hover { border-color: var(--brand); }
.cat-btn.active { background: var(--brand); color: #fff; border-color: var(--brand); }
</style>