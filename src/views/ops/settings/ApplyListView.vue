<template>
  <div>
    <div class="page-header"><h3>我的申请</h3></div>
    <div class="button-row">
      <a-button>撤回</a-button>
      <a-button>导出</a-button>
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
import { ref } from 'vue'

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
  { id: 1, title: '申请账号 op_svc_test', type: '账号申请', status: 'green', statusLabel: '已完成', createdAt: '2026-05-20 10:00:00', finishedAt: '2026-05-20 14:30:00' },
  { id: 2, title: '申请资源权限变更', type: '权限申请', status: 'blue', statusLabel: '审批中', createdAt: '2026-05-21 09:00:00', finishedAt: '--' },
  { id: 3, title: '申请备份任务', type: '任务申请', status: 'yellow', statusLabel: '已退回', createdAt: '2026-05-19 15:00:00', finishedAt: '2026-05-19 16:00:00' },
  { id: 4, title: '申请系统访问权限', type: '权限申请', status: 'green', statusLabel: '已完成', createdAt: '2026-05-18 11:00:00', finishedAt: '2026-05-18 13:00:00' },
  { id: 5, title: '申请数据库连接', type: '资源申请', status: 'blue', statusLabel: '审批中', createdAt: '2026-05-22 08:00:00', finishedAt: '--' },
])
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