<template>
  <div>
    <div class="page-header"><h3>我的申请</h3></div>
    <div class="filter-actions-bar">
      <a-button>撤回</a-button>
      <a-button>导出</a-button>
    </div>
    <div class="filter-bar">
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
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">查看</a>
          <a class="link-blue">催办</a>
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
  { title: '申请标题', dataIndex: 'title', key: 'title' },
  { title: '申请类型', dataIndex: 'type', key: 'type' },
  { title: '状态', dataIndex: 'statusLabel', key: 'status', width: 100 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '完成时间', dataIndex: 'finishedAt', key: 'finishedAt' },
  { title: '操作', key: 'action', width: 120 },
]

const data = ref([
  { id: 1, title: '数据库账号申请', type: '新建', status: 'approved', statusLabel: '已通过', createdAt: '2026-06-17 09:00:00', finishedAt: '2026-06-17 10:00:00' },
  { id: 2, title: '服务器权限变更', type: '变更', status: 'pending', statusLabel: '待审批', createdAt: '2026-06-17 10:00:00', finishedAt: '--' },
  { id: 3, title: 'VPN账号申请', type: '新建', status: 'rejected', statusLabel: '已拒绝', createdAt: '2026-06-17 11:00:00', finishedAt: '2026-06-17 11:30:00' },
  { id: 4, title: 'Redis集群扩容', type: '变更', status: 'approved', statusLabel: '已通过', createdAt: '2026-06-16 14:00:00', finishedAt: '2026-06-16 16:00:00' },
  { id: 5, title: '防火墙策略开通', type: '新建', status: 'pending', statusLabel: '待审批', createdAt: '2026-06-16 09:00:00', finishedAt: '--' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/app_orders?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          statusLabel: item.status_label,
          createdAt: item.created_at,
          finishedAt: item.finished_at,
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
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; justify-content: flex-end; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
.link-blue { color: var(--brand); cursor: pointer; font-size: 13px; }
.link-blue:hover { opacity: 0.8; }
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-yellow { background: #fa8c16; }
.dot-red { background: #f5222d; }
.dot-blue { background: #1890ff; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-actions-bar .ant-btn { flex: 1; min-width: 0; }
  .filter-bar .ant-input-search { width: 100% !important; }
}
</style>