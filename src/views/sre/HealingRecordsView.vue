<template>
  <div class="page-view">
    <div class="page-header"><h3>自愈执行记录</h3></div>
    <div class="filter-bar">
      <a-select v-model:value="statusFilter" style="width:140px" placeholder="状态筛选" allowClear>
        <a-select-option value="success">成功</a-select-option>
        <a-select-option value="running">执行中</a-select-option>
        <a-select-option value="failed">失败</a-select-option>
      </a-select>
      <a-input-search v-model:value="searchText" placeholder="搜索模板名称或关联故障..." allowClear />
    </div>
    <div v-if="loading" style="text-align:center;margin:60px 0"><a-spin /></div>
    <template v-else>
      <a-table :data-source="filteredRecords" :columns="columns" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ y: 420 }" :custom-row="r => ({ onClick: () => handleRowClick(r), style: { cursor: 'pointer' } })">
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'success' ? 'success' : record.status === 'running' ? 'processing' : 'error'">
              {{ record.status === 'success' ? '成功' : record.status === 'running' ? '执行中' : '失败' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'result'">
            <span v-if="record.result">{{ record.result.metric }}: {{ record.result.before }} → {{ record.result.after }}</span>
            <span v-else>-</span>
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
const records = ref([])
const statusFilter = ref(null)
const searchText = ref('')
const filteredRecords = computed(() => {
  let list = records.value
  if (statusFilter.value) list = list.filter(r => r.status === statusFilter.value)
  const kw = searchText.value.trim().toLowerCase()
  if (kw) list = list.filter(r => (r.templateName || '').toLowerCase().includes(kw) || (r.incidentId || '').toLowerCase().includes(kw))
  return list
})
const columns = [
  { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 160 },
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName', ellipsis: true },
  { title: '关联故障', dataIndex: 'incidentId', key: 'incidentId', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '进度', key: 'progress', width: 80, customRender: ({ record }) => `${record.currentStep}/${record.totalSteps}` },
  { title: '耗时', dataIndex: 'elapsed', key: 'elapsed', width: 80 },
  { title: '执行结果', key: 'result', width: 200 },
]
function handleRowClick(r) {
  router.push('/ops/incident/' + r.incidentId)
}
onMounted(async () => {
  try {
    const res = await fetch('/api/sre/healing-records')
    const json = await res.json()
    if (json.success) records.value = json.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
:deep(.ant-table-wrapper) { width: 100%; }
@media (max-width: 768px) {
  :deep(.ant-table-wrapper) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>