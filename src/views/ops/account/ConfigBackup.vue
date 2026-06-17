<template>
  <div>
    <div class="page-header"><h3>备份配置</h3></div>
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
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">执行</a>
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
  { title: '任务名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '备份类型', dataIndex: 'backupType', key: 'backupType' },
  { title: '备份目标', dataIndex: 'target', key: 'target' },
  { title: '备份周期', dataIndex: 'schedule', key: 'schedule' },
  { title: '保留份数', dataIndex: 'retention', key: 'retention' },
  { title: '最近备份', dataIndex: 'lastBackup', key: 'lastBackup', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 160 },
]
const data = ref([
  { id: 1, name: '操作系统账号备份', backupType: '全量备份', target: 'NFS存储', schedule: '每日02:00', retention: '30天', lastBackup: '2026/05/22 02:00:00', status: 'green', statusLabel: '成功' },
  { id: 2, name: '数据库账号备份', backupType: '全量备份', target: 'NFS存储', schedule: '每日03:00', retention: '30天', lastBackup: '2026/05/22 03:00:00', status: 'green', statusLabel: '成功' },
  { id: 3, name: '保管箱备份', backupType: '增量备份', target: '对象存储', schedule: '每小时', retention: '7天', lastBackup: '2026/05/22 08:00:00', status: 'green', statusLabel: '成功' },
  { id: 4, name: 'OP平台配置备份', backupType: '全量备份', target: 'Git仓库', schedule: '每周日04:00', retention: '12周', lastBackup: '2026/05/17 04:00:00', status: 'red', statusLabel: '失败' },
  { id: 5, name: '网络设备配置备份', backupType: '全量备份', target: 'FTP服务器', schedule: '每日05:00', retention: '90天', lastBackup: '2026/05/22 05:00:00', status: 'yellow', statusLabel: '进行中' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/backup_tasks?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          backupType: item.backup_type,
          target: item.target,
          schedule: item.schedule,
          retention: item.retention,
          lastBackup: item.last_backup,
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
