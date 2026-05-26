<template>
  <div>
    <div class="page-header">
      <h3>账号申请</h3>
    </div>
    <div class="tab-bar">
      <a-button
        :type="activeTab === 'apply' ? 'primary' : 'default'"
        @click="activeTab = 'apply'; $router.push('/ops/account/apply/create')">申请</a-button>
      <a-button
        :type="activeTab === 'urge' ? 'primary' : 'default'"
        @click="activeTab = 'urge'">催办</a-button>
      <a-button
        :type="activeTab === 'extend' ? 'primary' : 'default'"
        @click="activeTab = 'extend'">延期</a-button>
      <a-button
        :type="activeTab === 'delete' ? 'primary' : 'default'"
        @click="activeTab = 'delete'">删除</a-button>
    </div>
    <div class="search-row">
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索">
        <template #suffix>
          <i class="fa-solid fa-gear" style="color:#8c8c8c;cursor:pointer;font-size:14px"></i>
        </template>
      </a-input-search>
    </div>
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'orderId'">
          <a class="link-blue">{{ record.orderId }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell">
            <span class="status-dot" :class="'dot-' + record.statusDot"></span>
            {{ record.statusLabel }}
          </span>
        </template>
        <template v-if="column.key === 'action'">
          <template v-if="activeTab === 'apply' || activeTab === 'urge'">
            <a class="link-blue" style="margin-right:8px">催办</a>
            <a class="link-blue" style="margin-right:8px">延期</a>
            <a class="link-blue" style="margin-right:8px">删除</a>
          </template>
          <template v-else-if="activeTab === 'extend'">
            <a class="link-blue" style="margin-right:8px">延期</a>
          </template>
          <template v-else-if="activeTab === 'delete'">
            <a class="link-blue" style="margin-right:8px">确认删除</a>
          </template>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const activeTab = ref('apply')
const selectedRowKeys = ref([])
function onSelectChange(keys) { selectedRowKeys.value = keys }

const allData = ref([
  { id: 1, orderId: 'CS202201181564', status: 'completed', statusDot: 'green', statusLabel: '已完成', type: '一键登录', handler: '王嘉怡 w00657412', createdAt: '2023-02-06 12:00:00', finishedAt: '2023-02-06 12:30:00', tab: 'apply' },
  { id: 2, orderId: 'CS202201181514', status: 'pending', statusDot: 'blue', statusLabel: '审批中', type: '账号密码', handler: '李四 l00451234', createdAt: '2023-02-06 11:00:00', finishedAt: '--', tab: 'apply' },
  { id: 3, orderId: 'CS202201181500', status: 'completed', statusDot: 'green', statusLabel: '已完成', type: '账号回收', handler: '王嘉怡 w00657412', createdAt: '2023-02-05 14:00:00', finishedAt: '2023-02-05 14:20:00', tab: 'apply' },
  { id: 4, orderId: 'CS202201181490', status: 'pending', statusDot: 'blue', statusLabel: '审批中', type: 'OP账号登录', handler: '赵七 z00765432', createdAt: '2023-02-05 09:30:00', finishedAt: '--', tab: 'apply' },
  { id: 5, orderId: 'CS202201181480', status: 'rejected', statusDot: 'red', statusLabel: '已拒绝', type: '一键登录', handler: '--', createdAt: '2023-02-04 16:00:00', finishedAt: '2023-02-04 16:10:00', tab: 'apply' },
  { id: 6, orderId: 'CS202201181470', status: 'urged', statusDot: 'yellow', statusLabel: '已催办', type: '账号密码', handler: '王五 w00554321', createdAt: '2023-02-03 10:00:00', finishedAt: '--', tab: 'urge' },
  { id: 7, orderId: 'CS202201181460', status: 'urged', statusDot: 'yellow', statusLabel: '已催办', type: '一键登录', handler: '孙八 s00876543', createdAt: '2023-02-02 15:00:00', finishedAt: '--', tab: 'urge' },
  { id: 8, orderId: 'CS202201181450', status: 'extended', statusDot: 'blue', statusLabel: '已延期', type: '账号密码', handler: '周九 z00987654', createdAt: '2023-01-30 08:00:00', finishedAt: '--', tab: 'extend' },
  { id: 9, orderId: 'CS202201181440', status: 'extended', statusDot: 'blue', statusLabel: '已延期', type: 'OP账号登录', handler: '吴十 w01098765', createdAt: '2023-01-28 13:00:00', finishedAt: '--', tab: 'extend' },
  { id: 10, orderId: 'CS202201181430', status: 'deleted', statusDot: 'red', statusLabel: '已删除', type: '账号回收', handler: '系统', createdAt: '2023-01-25 11:00:00', finishedAt: '2023-01-25 11:05:00', tab: 'delete' },
])

const columns = [
  { title: '工单ID', dataIndex: 'orderId', key: 'orderId', sorter: true },
  { title: '工单状态', dataIndex: 'statusLabel', key: 'status', width: 100 },
  { title: '工单类型', dataIndex: 'type', key: 'type' },
  { title: '当前处理人', dataIndex: 'handler', key: 'handler' },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '审批完成时间', dataIndex: 'finishedAt', key: 'finishedAt', sorter: true },
  { title: '操作', key: 'action', width: 160 },
]

const filteredData = computed(() => {
  let tabMap = { apply: 'apply', urge: 'urge', extend: 'extend', delete: 'delete' }
  return allData.value.filter(d => d.tab === tabMap[activeTab.value])
})
</script>
<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab-bar .ant-btn { height: 32px; padding: 0 16px; }
.search-row { margin-bottom: 16px; }
.search-row :deep(.ant-input-search) { width: 100%; }
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
  .tab-bar { flex-wrap: wrap; }
  .tab-bar .ant-btn { flex: 1; min-width: 0; text-align: center; }
  .search-row .ant-input-search { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
