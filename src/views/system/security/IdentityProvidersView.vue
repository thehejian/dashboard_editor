<template>
  <div>
    <div class="page-header">
      <h3>身份提供商</h3>
      <a-button type="primary">新增提供商</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="协议类型" style="width: 140px" allowClear>
        <a-select-option value="SAML">SAML 2.0</a-select-option>
        <a-select-option value="OIDC">OIDC</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索提供商名称" style="width: 240px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag>{{ record.type }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'default'">{{ record.status === 'active' ? '已启用' : '未启用' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">编辑</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const search = ref('')
const filterType = ref(null)
const data = ref([
  { id: 1, name: '企业微信', type: 'OIDC', status: 'active', created: '2024-01-15' },
  { id: 2, name: '阿里云 RAM', type: 'SAML', status: 'active', created: '2024-03-20' },
  { id: 3, name: 'LDAP 目录服务', type: 'SAML', status: 'disabled', created: '2024-06-01' },
])
const columns = [
  { title: '提供商名称', dataIndex: 'name' },
  { title: '协议类型', key: 'type', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>
