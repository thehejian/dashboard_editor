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
    <div class="filter-bar">
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
import { ref, computed, onMounted } from 'vue'

const search = ref('')
const activeTab = ref('apply')
const selectedRowKeys = ref([])
function onSelectChange(keys) { selectedRowKeys.value = keys }

const allData = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/app_orders?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      allData.value = json.data.map(function(item) {
        return {
          id: item.id,
          orderId: item.order_id,
          status: item.status,
          statusDot: item.status === 'approved' ? 'green' : item.status === 'rejected' || item.status === 'deleted' ? 'red' : 'blue',
          statusLabel: item.status_label,
          type: item.type,
          handler: item.handler,
          createdAt: item.created_at,
          finishedAt: item.finished_at || '--',
          tab: item.type === '账号回收' ? 'delete' : item.status === 'approved' ? 'apply' : item.status,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const statusFilters = [
  { text: '已完成', value: 'completed' },
  { text: '审批中', value: 'pending' },
  { text: '已拒绝', value: 'rejected' },
  { text: '已催办', value: 'urged' },
  { text: '已延期', value: 'extended' },
  { text: '已删除', value: 'deleted' },
]
const typeFilters = [
  { text: '一键登录', value: '一键登录' },
  { text: '账号密码', value: '账号密码' },
  { text: 'OP账号登录', value: 'OP账号登录' },
  { text: '账号回收', value: '账号回收' },
]

const columns = [
  { title: '工单ID', dataIndex: 'orderId', key: 'orderId', sorter: true },
  { title: '工单状态', dataIndex: 'statusLabel', key: 'status', width: 100, filters: statusFilters, onFilter: (value, record) => record.status === value },
  { title: '工单类型', dataIndex: 'type', key: 'type', filters: typeFilters, onFilter: (value, record) => record.type === value },
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
  .tab-bar { flex-wrap: wrap; }
  .tab-bar .ant-btn { flex: 1; min-width: 0; text-align: center; }
  .filter-bar :deep(.ant-input-search) { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
