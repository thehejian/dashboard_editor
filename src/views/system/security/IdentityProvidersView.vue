<template>
  <div>
    <div class="page-header">
      <h3>身份提供商</h3>
    </div>
    <div class="button-row">
      <a-button type="primary" @click="goCreate">创建身份提供商</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const search = ref('')
const filterType = ref(null)

const data = ref([
  { id: 1, name: '企业微信', protocol: 'OAuth', status: 'active', created: '2024-01-15', updated: '2025-05-19 10:30', desc: '企业微信 OAuth 身份认证' },
  { id: 2, name: '阿里云 RAM', protocol: 'SAML', status: 'active', created: '2024-03-20', updated: '2025-05-18 14:20', desc: '阿里云 RAM SAML 2.0 联邦认证' },
  { id: 3, name: 'LDAP 目录服务', protocol: 'LDAP', status: 'disabled', created: '2024-06-01', updated: '2025-04-15 09:00', desc: '企业内部 LDAP 目录同步' },
  { id: 4, name: '统一认证平台', protocol: 'CAS', status: 'active', created: '2024-08-10', updated: '2025-05-17 16:45', desc: 'CAS 2.0 单点登录认证' },
])

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
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-row { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-row .ant-input-search { flex: 1; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
</style>
