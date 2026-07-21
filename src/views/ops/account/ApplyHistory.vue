<template>
  <div>
    <div class="page-header"><h3>已申请账号</h3></div>
    <div class="filter-actions-bar">
      <a-button>撤回</a-button>
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
          <a class="link-blue" style="margin-right: 12px">查看</a>
          <a class="link-blue">撤回</a>
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
  { title: '申请账号', dataIndex: 'name', key: 'name', sorter: true },
  { title: '资源类型', dataIndex: 'resType', key: 'resType' },
  { title: '申请原因', dataIndex: 'reason', key: 'reason' },
  { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
  { title: '审批人', dataIndex: 'approver', key: 'approver' },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 120 },
]
const data = ref([
  { id: 1, name: 'db_readonly', resType: 'MySQL', reason: '日常查询需要', applicant: '张三', approver: '李运维', createdAt: '2026/05/21 10:30:00', status: 'green', statusLabel: '已通过' },
  { id: 2, name: 'op_developer', resType: 'OP账号', reason: '开发环境部署', applicant: '王五', approver: '李运维', createdAt: '2026/05/20 14:15:00', status: 'yellow', statusLabel: '审批中' },
  { id: 3, name: 'ssh_bastion', resType: '操作系统', reason: '堡垒机接入', applicant: '赵六', approver: '--', createdAt: '2026/05/19 09:00:00', status: 'red', statusLabel: '已拒绝' },
  { id: 4, name: 'kafka_producer', resType: '中间件', reason: '消息生产接入', applicant: '张三', approver: '李运维', createdAt: '2026/05/18 16:45:00', status: 'green', statusLabel: '已通过' },
  { id: 5, name: 'switch_viewer', resType: '网络设备', reason: '巡检需要', applicant: '王五', approver: '--', createdAt: '2026/05/17 11:20:00', status: 'yellow', statusLabel: '审批中' },
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
          name: item.name,
          resType: item.res_type,
          reason: item.reason,
          applicant: item.applicant,
          approver: item.approver,
          createdAt: item.created_at,
          status: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'yellow',
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
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; }
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
