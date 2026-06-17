<template>
  <div>
    <div class="page-header">
      <h3>日志转发任务</h3>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="targetType" placeholder="目标类型" style="width: 130px" allowClear>
        <a-select-option value="Kafka">Kafka</a-select-option>
        <a-select-option value="Syslog">Syslog</a-select-option>
        <a-select-option value="HTTP">HTTP</a-select-option>
        <a-select-option value="ES">Elasticsearch</a-select-option>
      </a-select>
      <a-select v-model:value="enabled" placeholder="状态" style="width: 100px" allowClear>
        <a-select-option value="启用">启用</a-select-option>
        <a-select-option value="停用">停用</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索任务名/目标地址" style="width: 280px" />
      <a-button type="primary" style="margin-left: auto">新建任务</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 800 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'targetType'">
          <a-tag :color="record.targetType === 'Kafka' ? 'purple' : record.targetType === 'Syslog' ? 'blue' : record.targetType === 'ES' ? 'green' : 'orange'">{{ record.targetType }}</a-tag>
        </template>
        <template v-if="column.key === 'enabled'">
          <a-switch v-model:checked="record.enabled" size="small" />
        </template>
        <template v-if="column.key === 'forwardContent'">
          <span>{{ record.forwardContent?.join('、') }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">{{ record.enabled ? '停用' : '启用' }}</a-button>
          <a-button type="link" size="small">修改</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const search = ref('')
const targetType = ref(null)
const enabled = ref(null)
const data = ref([
  { id: 1, name: '应用到日志中心', targetType: 'Kafka', targetAddr: 'kafka-prod-01:9092', forwardContent: ['app-*', 'nginx-*'], enabled: true, lastForward: '2026-06-17 10:30:00' },
  { id: 2, name: 'DB日志到ELK', targetType: 'Elasticsearch', targetAddr: 'es-prod-01:9200', forwardContent: ['mysql-slow', 'mysql-error'], enabled: true, lastForward: '2026-06-17 10:28:00' },
  { id: 3, name: '安全日志到SIEM', targetType: 'Syslog', targetAddr: 'siem-01:514', forwardContent: ['auth-*', 'audit-*'], enabled: true, lastForward: '2026-06-17 10:30:00' },
  { id: 4, name: '调试日志丢弃', targetType: 'DevNull', targetAddr: 'file://dev/null', forwardContent: ['debug-*'], enabled: false, lastForward: null },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/log_forward_tasks?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          targetType: item.target_type,
          targetAddr: item.target_addr,
          forwardContent: item.forward_content || [],
          enabled: item.enabled,
          lastForward: item.last_forward,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
const columns = [
  { title: '任务名', dataIndex: 'name' },
  { title: '目标类型', key: 'targetType', width: 100 },
  { title: '目标地址', dataIndex: 'targetAddr' },
  { title: '转发内容', key: 'forwardContent' },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '最后转发时间', dataIndex: 'lastForward', width: 170 },
  { title: '操作', key: 'action', width: 180 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
@media (max-width: 768px) {
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-select),
  .filter-bar :deep(.ant-input-search),
  .filter-bar :deep(.ant-btn) { flex: 1 1 calc(50% - 4px); min-width: 0; }
  .filter-bar :deep(.ant-btn[style*="margin-left"]) { margin-left: 0 !important; }
  .page-header h3 { font-size: 15px; }
}
</style>
