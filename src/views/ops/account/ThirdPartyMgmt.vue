<template>
  <div>
    <div class="page-header">
      <h3>第三方纳管</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button type="primary">创建</a-button>
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

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

const columns = [
  { title: '平台名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: 'AppID', dataIndex: 'appId', key: 'appId' },
  { title: '协议类型', dataIndex: 'protocol', key: 'protocol' },
  { title: '同步方式', dataIndex: 'syncMethod', key: 'syncMethod' },
  { title: '最后同步时间', dataIndex: 'lastSync', key: 'lastSync', sorter: true },
  { title: '绑定账号数', dataIndex: 'bindCount', key: 'bindCount', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 120 },
]

const data = ref([
  { id: 1, name: '企业微信', appId: 'wxCorp123456', protocol: 'OAuth2/OIDC', syncMethod: '自动同步', lastSync: '2026/05/22 08:00:00', bindCount: 156, status: 'green', statusLabel: '已接入' },
  { id: 2, name: '钉钉', appId: 'ding789012', protocol: 'OAuth2/OIDC', syncMethod: '自动同步', lastSync: '2026/05/22 08:00:00', bindCount: 89, status: 'green', statusLabel: '已接入' },
  { id: 3, name: '飞书', appId: 'feishu345678', protocol: 'OAuth2/OIDC', syncMethod: '手动同步', lastSync: '2026/05/20 14:30:00', bindCount: 42, status: 'green', statusLabel: '已接入' },
  { id: 4, name: 'LDAP', appId: 'ldap901234', protocol: 'LDAP', syncMethod: '自动同步', lastSync: '2026/05/22 06:00:00', bindCount: 320, status: 'green', statusLabel: '已接入' },
  { id: 5, name: 'JumpServer堡垒机', appId: 'jms567890', protocol: 'SSH/RDP', syncMethod: '自动同步', lastSync: '2026/05/21 23:59:00', bindCount: 78, status: 'red', statusLabel: '连接异常' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/integration_accounts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          appId: item.provider,
          protocol: 'OAuth2/OIDC',
          syncMethod: '自动同步',
          lastSync: item.last_sync,
          bindCount: 0,
          status: item.status,
          statusLabel: item.status,
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
