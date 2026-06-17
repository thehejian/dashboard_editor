<template>
  <div>
    <div class="page-header"><h3>待办事项</h3></div>
    <div class="button-row">
      <a-button>标记完成</a-button>
      <a-button>批量处理</a-button>
    </div>
    <div class="search-row">
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索" />
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          <a class="link-blue">{{ record.title }}</a>
        </template>
        <template v-if="column.key === 'priority'">
          <span class="priority-tag" :class="'priority-' + record.priority">{{ record.priorityLabel }}</span>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">处理</a>
          <a class="link-blue">详情</a>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const search = ref('')
const selectedRowKeys = ref([])
function onSelectChange(keys) { selectedRowKeys.value = keys }

const columns = [
  { title: '待办标题', dataIndex: 'title', key: 'title' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '优先级', dataIndex: 'priorityLabel', key: 'priority', width: 100 },
  { title: '截止时间', dataIndex: 'deadline', key: 'deadline', sorter: true },
  { title: '状态', dataIndex: 'statusLabel', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '操作', key: 'action', width: 120 },
]

const data = ref([
  { id: 1, title: '处理数据库主从延迟告警', source: '告警系统', priority: 'critical', priorityLabel: '紧急', deadline: '2026-06-17 12:00:00', status: 'pending', statusLabel: '待处理', createdAt: '2026-06-17 10:00:00' },
  { id: 2, title: '更新SSL证书', source: '运维计划', priority: 'high', priorityLabel: '高', deadline: '2026-06-20 18:00:00', status: 'pending', statusLabel: '待处理', createdAt: '2026-06-17 08:00:00' },
  { id: 3, title: 'Q2机房巡检报告', source: '管理任务', priority: 'normal', priorityLabel: '普通', deadline: '2026-06-30 18:00:00', status: 'in_progress', statusLabel: '进行中', createdAt: '2026-06-15 09:00:00' },
  { id: 4, title: '安全基线合规检查', source: '安全组', priority: 'high', priorityLabel: '高', deadline: '2026-06-25 18:00:00', status: 'pending', statusLabel: '待处理', createdAt: '2026-06-14 10:00:00' },
  { id: 5, title: '升级Kong网关到3.6', source: '版本计划', priority: 'low', priorityLabel: '低', deadline: '2026-07-15 18:00:00', status: 'pending', statusLabel: '待处理', createdAt: '2026-06-13 16:00:00' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/todos?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          title: item.title,
          source: item.source,
          priority: item.priority,
          priorityLabel: item.priority_label,
          deadline: item.deadline,
          status: item.status,
          statusLabel: item.status_label,
          createdAt: item.created_at,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.search-row { margin-bottom: 16px; }
.link-blue { color: var(--brand); cursor: pointer; font-size: 13px; }
.link-blue:hover { opacity: 0.8; }
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-yellow { background: #fa8c16; }
.dot-red { background: #f5222d; }
.dot-blue { background: #1890ff; }
.priority-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.priority-high { background: #fff2f0; color: #f5222d; }
.priority-medium { background: #fff7e6; color: #fa8c16; }
.priority-low { background: #f6ffed; color: #52c41a; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .button-row { flex-wrap: wrap; }
  .button-row .ant-btn { flex: 1; min-width: 0; }
  .search-row .ant-input-search { width: 100% !important; }
}
</style>