<template>
  <div>
    <div class="page-header"><h3>设备及其他账号策略</h3></div>
    <div class="button-row">
      <a-button>创建</a-button>
      <a-button>删除</a-button>
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
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">修改</a>
          <a class="link-blue">删除</a>
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
  { title: '策略名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '密码最小长度', dataIndex: 'minLen', key: 'minLen' },
  { title: '密码有效期(天)', dataIndex: 'expireDays', key: 'expireDays', sorter: true },
  { title: '锁定阈值(次)', dataIndex: 'lockThreshold', key: 'lockThreshold' },
  { title: '锁定时长(分钟)', dataIndex: 'lockDuration', key: 'lockDuration' },
  { title: '超时断开(分钟)', dataIndex: 'timeout', key: 'timeout' },
  { title: '适用范围', dataIndex: 'scope', key: 'scope' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 120 },
]
const data = ref([
  { id: 1, name: '网络设备默认策略', minLen: '14', expireDays: 90, lockThreshold: 5, lockDuration: 30, timeout: 15, scope: '全部网络设备', status: 'green', statusLabel: '启用' },
  { id: 2, name: '安全设备策略', minLen: '16', expireDays: 60, lockThreshold: 3, lockDuration: 60, timeout: 10, scope: '防火墙/VPN', status: 'green', statusLabel: '启用' },
  { id: 3, name: '带外管理策略', minLen: '12', expireDays: 30, lockThreshold: 3, lockDuration: 120, timeout: 5, scope: 'iLO/BMC', status: 'yellow', statusLabel: '停用' },
  { id: 4, name: 'IoT设备策略', minLen: '8', expireDays: 365, lockThreshold: 10, lockDuration: 15, timeout: 60, scope: '摄像头/传感器', status: 'green', statusLabel: '启用' },
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
