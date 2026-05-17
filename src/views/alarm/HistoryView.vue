<template>
  <div class="page-view">
    <div class="page-header"><h2>历史告警</h2></div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="搜索告警" style="width: 280px" />
      <a-select v-model:value="level" placeholder="告警级别" style="width: 120px" allowClear>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="warning">重要</a-select-option>
        <a-select-option value="info">次要</a-select-option>
      </a-select>
    </div>
    <a-table :columns="columns" :data-source="historyData" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
        <template v-if="column.key === 'status'"><a-tag :color="record.status === 'resolved' ? 'green' : 'default'">{{ record.status === 'resolved' ? '已恢复' : '处理中' }}</a-tag></template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const search = ref('')
const level = ref(null)
const historyData = ref([
  { id: 101, level: 'critical', title: '网络延迟过高', resource: 'lb-001', time: '2026-05-17 08:30', duration: '15分钟', status: 'resolved' },
  { id: 102, level: 'warning', title: '数据库连接池满', resource: 'db-002', time: '2026-05-16 14:20', duration: '30分钟', status: 'resolved' },
])
const columns = [
  { title: '告警标题', dataIndex: 'title' }, { title: '资源', dataIndex: 'resource' },
  { title: '级别', key: 'level' }, { title: '触发时间', dataIndex: 'time' },
  { title: '持续时间', dataIndex: 'duration' }, { title: '状态', key: 'status' },
]
const getLevelColor = (l) => ({ critical: 'red', warning: 'orange', info: 'blue' }[l])
const getLevelText = (l) => ({ critical: '紧急', warning: '重要', info: '次要' }[l])
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
</style>