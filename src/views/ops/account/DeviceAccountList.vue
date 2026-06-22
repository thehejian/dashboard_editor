<template>
  <div>
    <div class="page-header"><h3>设备及其他账号</h3></div>
    <div class="filter-actions-bar">
      <a-button>创建</a-button>
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
          <a class="link-blue" style="margin-right: 12px">修改</a>
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
  { title: '账号名', dataIndex: 'name', key: 'name', sorter: true },
  { title: '设备类型', dataIndex: 'devType', key: 'devType' },
  { title: '管理IP', dataIndex: 'ip', key: 'ip' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '所属位置', dataIndex: 'location', key: 'location' },
  { title: '关联用户', dataIndex: 'user', key: 'user' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '操作', key: 'action', width: 120 },
]
const data = ref([
  { id: 1, name: 'switch_admin', devType: '华为交换机', ip: '10.0.1.1', status: 'green', statusLabel: '正常', location: '机房A-01柜', user: '张运维', createdAt: '2024/01/15 09:00:00' },
  { id: 2, name: 'fw_admin', devType: '山石防火墙', ip: '10.0.0.254', status: 'green', statusLabel: '正常', location: '机房A-02柜', user: '李运维', createdAt: '2024/03/20 10:30:00' },
  { id: 3, name: 'ups_admin', devType: 'UPS电源', ip: '10.0.100.10', status: 'red', statusLabel: '离线', location: '机房B电力间', user: '王运维', createdAt: '2024/06/10 14:00:00' },
  { id: 4, name: 'ilo_admin', devType: 'iLO带外', ip: '10.0.200.50', status: 'green', statusLabel: '正常', location: '机房A管理网', user: '赵运维', createdAt: '2024/08/05 11:20:00' },
  { id: 5, name: 'camera_admin', devType: '监控摄像头', ip: '10.0.50.5', status: 'yellow', statusLabel: '告警', location: '机房A-03柜', user: '张运维', createdAt: '2024/02/28 16:45:00' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/accounts?account_type=DEVICE&sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          devType: item.dev_type,
          ip: item.ip,
          host: item.host,
          port: item.port,
          instance: item.instance,
          dbType: item.db_type,
          mwType: item.mw_type,
          osType: item.os_type,
          system: item.system,
          status: item.status,
          statusLabel: item.status_label,
          location: item.location,
          user: item.user,
          role: item.role,
          lastLogin: item.last_login,
          app: item.app,
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
