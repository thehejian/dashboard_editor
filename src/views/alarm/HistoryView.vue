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
    <a-table :columns="columns" :data-source="filteredData" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ y: scrollY, x: 900 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
        <template v-if="column.key === 'status'"><a-tag :color="record.status === 'resolved' ? 'green' : 'default'">{{ record.status === 'resolved' ? '已恢复' : '处理中' }}</a-tag></template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const search = ref('')
const level = ref(null)
const scrollY = ref(500)
const historyData = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/alerts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      historyData.value = json.data.filter(function(i) { return i.status !== 'firing' }).map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          time: item.trigger_time,
          duration: item.duration,
          status: item.status,
        }
      })
    }
  } catch (e) {
    console.error('加载历史告警失败:', e)
  } finally {
    loading.value = false
  }
})
const columns = [
  { title: '告警标题', dataIndex: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', ellipsis: true },
  { title: '级别', key: 'level', width: 80 },
  { title: '触发时间', dataIndex: 'time', width: 170 },
  { title: '持续时间', dataIndex: 'duration', width: 100 },
  { title: '状态', key: 'status', width: 90 },
]
const getLevelColor = (l) => ({ critical: 'red', warning: 'orange', info: 'blue' }[l])
const getLevelText = (l) => ({ critical: '紧急', warning: '重要', info: '次要' }[l])

const filteredData = computed(() => {
  var list = historyData.value
  if (search.value) {
    var kw = search.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) || a.resource.toLowerCase().includes(kw) })
  }
  if (level.value) {
    list = list.filter(function(a) { return a.level === level.value })
  }
  return list
})

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})
onUnmounted(function() {
  window.removeEventListener('resize', updateScrollY)
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 24px 0; height: 100%; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; }
:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
</style>