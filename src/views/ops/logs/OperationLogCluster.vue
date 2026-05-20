<template>
  <div>
    <div class="page-header">
      <h3>集群状态</h3>
      <a-button>刷新</a-button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:24px">
      <div v-for="card in cards" :key="card.title" style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:20px">
        <div style="font-size:12px;color:var(--text-sec);margin-bottom:8px">{{ card.title }}</div>
        <div style="font-size:28px;font-weight:600;color:var(--text)">{{ card.value }}</div>
        <div :style="{fontSize:12,color:card.status==='normal'?'#52c41a':'#f5222d',marginTop:4}">
          {{ card.status === 'normal' ? '正常' : '异常' }}
        </div>
      </div>
    </div>
    <div class="page-header" style="margin-top:16px"><h3>节点列表</h3></div>
    <a-table :columns="columns" :data-source="nodes" :pagination="{ pageSize: 5 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'online' ? 'green' : 'red'">{{ record.status === 'online' ? '在线' : '离线' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">详情</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const cards = ref([
  { title: '采集器节点', value: 12, status: 'normal' },
  { title: '存储节点', value: 6, status: 'normal' },
  { title: '索引节点', value: 4, status: 'normal' },
  { title: '今日日志量', value: '2.3TB', status: 'normal' },
])
const nodes = ref([
  { id: 1, name: 'log-collector-01', ip: '10.0.1.10', role: '采集器', status: 'online', load: '42%' },
  { id: 2, name: 'log-collector-02', ip: '10.0.1.11', role: '采集器', status: 'online', load: '38%' },
  { id: 3, name: 'log-storage-01', ip: '10.0.2.10', role: '存储', status: 'online', load: '67%' },
  { id: 4, name: 'log-storage-02', ip: '10.0.2.11', role: '存储', status: 'offline', load: '0%' },
  { id: 5, name: 'log-index-01', ip: '10.0.3.10', role: '索引', status: 'online', load: '55%' },
])
const columns = [
  { title: '节点名称', dataIndex: 'name' },
  { title: 'IP', dataIndex: 'ip' },
  { title: '角色', dataIndex: 'role', width: 90 },
  { title: '状态', key: 'status', width: 80 },
  { title: '负载', dataIndex: 'load', width: 80 },
  { title: '操作', key: 'action', width: 80 },
]
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
</style>
