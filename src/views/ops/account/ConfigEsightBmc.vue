<template>
  <div>
    <div class="page-header"><h3>更新eSight对接BMC密码</h3></div>
    <div class="button-row">
      <a-button>批量更新</a-button>
      <a-button>同步状态</a-button>
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
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">更新密码</a>
          <a class="link-blue">查看日志</a>
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
  { title: '设备名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '设备类型', dataIndex: 'devType', key: 'devType' },
  { title: 'BMC IP', dataIndex: 'bmcIp', key: 'bmcIp' },
  { title: '固件版本', dataIndex: 'firmware', key: 'firmware' },
  { title: '对接状态', dataIndex: 'status', key: 'status' },
  { title: '上次更新', dataIndex: 'lastUpdate', key: 'lastUpdate', sorter: true },
  { title: '操作', key: 'action', width: 150 },
]
const data = ref([
  { id: 1, name: 'Server-001', devType: '华为RH2288H', bmcIp: '10.0.100.1', firmware: 'iBMC V3.0', status: 'green', statusLabel: '已同步', lastUpdate: '2026/05/22 02:00:00' },
  { id: 2, name: 'Server-002', devType: '华为RH2288H', bmcIp: '10.0.100.2', firmware: 'iBMC V3.0', status: 'green', statusLabel: '已同步', lastUpdate: '2026/05/22 02:00:00' },
  { id: 3, name: 'Server-003', devType: '浪潮NF5280', bmcIp: '10.0.100.3', firmware: 'BMC V2.5', status: 'red', statusLabel: '密码过期', lastUpdate: '2025/12/01 02:00:00' },
  { id: 4, name: 'Server-004', devType: '华为RH2288H', bmcIp: '10.0.100.4', firmware: 'iBMC V3.1', status: 'yellow', statusLabel: '同步中', lastUpdate: '2026/05/22 02:05:00' },
  { id: 5, name: 'Server-005', devType: '戴尔R750', bmcIp: '10.0.100.5', firmware: 'iDRAC 9', status: 'red', statusLabel: '对接失败', lastUpdate: '2026/04/15 02:00:00' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/ci?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          devType: item.dev_type || item.os_type || '服务器',
          bmcIp: item.ip,
          firmware: item.metadata && item.metadata.firmware ? item.metadata.firmware : '--',
          status: item.status === 'running' ? 'green' : 'red',
          statusLabel: item.status === 'running' ? '已同步' : '异常',
          lastUpdate: item.updated_at,
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
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .page-header .ant-btn { width: 100%; }
  .button-row { flex-wrap: wrap; }
  .button-row .ant-btn { flex: 1; min-width: 0; }
  .search-row .ant-input-search { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
