<template>
  <div>
    <div class="page-header"><h3>快照管理</h3></div>
    <div class="filter-actions-bar">
      <a-button>创建快照</a-button>
      <a-button>回滚</a-button>
      <a-button>删除</a-button>
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
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">回滚</a>
          <a class="link-blue" style="margin-right: 12px">对比</a>
          <a class="link-blue">删除</a>
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
  { title: '快照名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '关联资产', dataIndex: 'asset', key: 'asset' },
  { title: '快照类型', dataIndex: 'snapType', key: 'snapType' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '快照大小', dataIndex: 'size', key: 'size' },
  { title: '创建人', dataIndex: 'creator', key: 'creator' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 180 },
]
const data = ref([
  { id: 1, name: '升级前基线-20260522', asset: 'prod-mysql-01', snapType: '手动', createdAt: '2026/05/22 02:00:00', size: '2.3GB', creator: '张运维', status: 'green', statusLabel: '可用' },
  { id: 2, name: '更新前备份', asset: 'Server-001-BMC', snapType: '自动', createdAt: '2026/05/21 14:30:00', size: '128MB', creator: '系统', status: 'green', statusLabel: '可用' },
  { id: 3, name: '配置变更快照', asset: 'core-switch-a', snapType: '手动', createdAt: '2026/05/20 09:15:00', size: '512KB', creator: '李运维', status: 'green', statusLabel: '可用' },
  { id: 4, name: '大版本升级快照', asset: 'op-platform', snapType: '手动', createdAt: '2026/05/15 23:00:00', size: '1.8GB', creator: '王运维', status: 'red', statusLabel: '异常' },
  { id: 5, name: '日常快照', asset: 'prod-mysql-01', snapType: '自动', createdAt: '2026/05/14 02:00:00', size: '2.3GB', creator: '系统', status: 'green', statusLabel: '可用' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/snapshots?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          asset: item.name,
          snapType: item.snap_type,
          createdAt: item.created_at,
          size: item.size,
          creator: item.creator,
          status: item.status,
          statusLabel: item.status_label,
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
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .page-header .ant-btn { width: 100%; }
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-actions-bar .ant-btn { flex: 1; min-width: 0; }
  .filter-bar :deep(.ant-input-search) { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
