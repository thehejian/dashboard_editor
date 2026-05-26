<template>
  <div>
    <div class="page-header"><h3>账号申请</h3></div>
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
          <a class="link-blue" style="margin-right: 12px">申请</a>
          <a class="link-blue">查看</a>
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
  { title: '资源名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '资源类型', dataIndex: 'resType', key: 'resType' },
  { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
  { title: '当前拥有者', dataIndex: 'owner', key: 'owner' },
  { title: '可申请角色', dataIndex: 'role', key: 'role' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 120 },
]
const data = ref([
  { id: 1, name: 'prod-mysql-01', resType: 'MySQL', ip: '192.168.10.10', owner: '数据库团队', role: '只读/开发', status: 'green', statusLabel: '可申请' },
  { id: 2, name: 'bastion-host', resType: '堡垒机', ip: '192.168.1.200', owner: '运维中心', role: '运维/审计', status: 'green', statusLabel: '可申请' },
  { id: 3, name: 'kafka-cluster', resType: 'Kafka', ip: '192.168.20.30', owner: '中间件团队', role: '生产者/消费者', status: 'green', statusLabel: '可申请' },
  { id: 4, name: 'core-switch-a', resType: '交换机', ip: '10.0.1.1', owner: '网络团队', role: '只读/管理', status: 'yellow', statusLabel: '需审批' },
  { id: 5, name: 'op-platform', resType: 'OP平台', ip: '192.168.30.100', owner: '运维中心', role: '操作员/审计员', status: 'green', statusLabel: '可申请' },
])
</script>
<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
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
