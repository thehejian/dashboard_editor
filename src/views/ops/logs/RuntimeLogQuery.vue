<template>
  <div>
    <div class="page-header">
      <h3>运行日志</h3>
    </div>
    <div class="filter-bar">
      <a-range-picker v-model:value="timeRange" style="width: 240px" />
      <a-select v-model:value="level" placeholder="级别" style="width: 110px" allowClear>
        <a-select-option value="info">INFO</a-select-option>
        <a-select-option value="warn">WARN</a-select-option>
        <a-select-option value="error">ERROR</a-select-option>
        <a-select-option value="critical">CRITICAL</a-select-option>
      </a-select>
      <a-select v-model:value="source" placeholder="来源" style="width: 140px" allowClear>
        <a-select-option value="api-gateway">API网关</a-select-option>
        <a-select-option value="user-service">用户服务</a-select-option>
        <a-select-option value="monitor">监控服务</a-select-option>
        <a-select-option value="scheduler">调度任务</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索日志内容" style="width: 300px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 700 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <a-tag :color="record.level === 'error' ? 'red' : record.level === 'warn' ? 'orange' : record.level === 'critical' ? 'magenta' : 'blue'">{{ record.level.toUpperCase() }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">查看</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const timeRange = ref(null)
const level = ref(null)
const source = ref(null)
const data = ref([
  { id: 1, time: '2026-05-20 14:35:20', level: 'error', source: 'user-service', instance: '10.0.1.5', message: 'Connection timeout to database db-primary' },
  { id: 2, time: '2026-05-20 14:34:15', level: 'warn', source: 'scheduler', instance: '10.0.1.8', message: 'Task queue is accumulating (142 pending)' },
  { id: 3, time: '2026-05-20 14:33:10', level: 'info', source: 'api-gateway', instance: '10.0.1.1', message: 'User admin logged in from 192.168.1.100' },
  { id: 4, time: '2026-05-20 14:32:00', level: 'critical', source: 'monitor', instance: '10.0.1.12', message: 'Disk usage on /data exceeds 95%' },
  { id: 5, time: '2026-05-20 14:30:45', level: 'info', source: 'user-service', instance: '10.0.1.5', message: 'Password change request processed for user ops1' },
])
const columns = [
  { title: '时间', dataIndex: 'time', width: 170 },
  { title: '级别', key: 'level', width: 90 },
  { title: '来源服务', dataIndex: 'source' },
  { title: '实例', dataIndex: 'instance', width: 110 },
  { title: '日志内容', dataIndex: 'message', ellipsis: true },
  { title: '操作', key: 'action', width: 70 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
@media (max-width: 768px) {
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-select),
  .filter-bar :deep(.ant-input-search),
  .filter-bar :deep(.ant-picker) { flex: 1 1 calc(50% - 4px); min-width: 0; }
  .page-header h3 { font-size: 15px; }
}
</style>
