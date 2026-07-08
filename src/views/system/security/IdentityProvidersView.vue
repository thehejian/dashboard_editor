<template>
  <div>
    <div class="page-header">
      <h3>身份提供商</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button type="primary" @click="goCreate">创建身份提供商</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="协议类型" style="width: 160px" allowClear>
        <a-select-option value="SAML">SAML 2.0</a-select-option>
        <a-select-option value="CAS">CAS 2.0</a-select-option>
        <a-select-option value="LDAP">LDAP</a-select-option>
        <a-select-option value="OAuth">OAuth 2.0</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索提供商名称" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'protocol'">
          <a-tag>{{ record.protocol }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch :checked="record.status === 'active'" @change="toggleStatus(record)" size="small" />
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="toggleStatus(record)">{{ record.status === 'active' ? '停用' : '启用' }}</a-button>
          <a-button type="link" size="small" danger @click="remove(record)">删除</a-button>
          <a-button type="link" size="small" @click="exportProvider(record)">导出</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const search = ref('')
const filterType = ref(null)
const data = ref([
  { id: 1, name: 'LDAP', protocol: 'LDAP', status: 'active', statusLabel: '已启用', created: '2024-01-01', updated: '2024-06-01', desc: '公司LDAP目录服务' },
  { id: 2, name: 'SAML2', protocol: 'SAML 2.0', status: 'active', statusLabel: '已启用', created: '2024-02-01', updated: '2024-06-01', desc: '统一身份认证SAML2' },
  { id: 3, name: 'OIDC', protocol: 'OpenID Connect', status: 'active', statusLabel: '已启用', created: '2024-03-01', updated: '2024-06-01', desc: '基于OIDC的单点登录' },
  { id: 4, name: 'CAS', protocol: 'CAS 3.0', status: 'inactive', statusLabel: '已停用', created: '2024-01-01', updated: '2024-03-01', desc: '旧版SSO协议' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/identity_providers?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          protocol: item.protocol,
          status: item.status,
          statusLabel: item.status === 'active' ? '已启用' : '已停用',
          created: item.created_at,
          updated: item.updated_at,
          desc: item.description,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '协议类型', key: 'protocol', width: 110 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '最后更新时间', dataIndex: 'updated' },
  { title: '描述', dataIndex: 'desc' },
  { title: '操作', key: 'action', width: 200 },
]

function goCreate() {
  router.push('/system/security/idp/create')
}

function toggleStatus(r) {
  r.status = r.status === 'active' ? 'disabled' : 'active'
}

function remove(r) {
  data.value = data.value.filter(d => d.id !== r.id)
}

function exportProvider(r) {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.name}-config.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; justify-content: flex-start; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }

@media (max-width: 768px) {
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-input-search) { width: 100%; }
  .filter-bar .ant-select { width: 100% !important; }
}</style>
