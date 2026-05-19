<template>
  <div>
    <div class="page-header">
      <h3>集成账号</h3>
      <a-button type="primary">新增集成账号</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterProvider" placeholder="所属提供商" style="width: 160px" allowClear>
        <a-select-option v-for="p in providers" :key="p" :value="p">{{ p }}</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索账号名称" style="width: 240px" />
    </div>
    <a-table :columns="columns" :data-source="filteredData" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status === 'active' ? '正常' : '异常' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">同步</a-button>
          <a-button type="link" size="small">编辑</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const filterProvider = ref(null)
const providers = ['企业微信', '阿里云 RAM', 'LDAP 目录服务']
const data = ref([
  { id: 1, name: 'ops_bot', provider: '企业微信', status: 'active', lastSync: '2025-05-19 10:30:00' },
  { id: 2, name: 'aliyun_ram_role', provider: '阿里云 RAM', status: 'active', lastSync: '2025-05-19 09:15:00' },
  { id: 3, name: 'ldap_sync_user', provider: 'LDAP 目录服务', status: 'error', lastSync: '2025-05-19 08:00:00' },
])
const filteredData = computed(() => data.value.filter(d =>
  (!filterProvider.value || d.provider === filterProvider.value) &&
  (!search.value || d.name.includes(search.value))
))
const columns = [
  { title: '账号名称', dataIndex: 'name' },
  { title: '所属提供商', dataIndex: 'provider' },
  { title: '状态', key: 'status', width: 80 },
  { title: '最后同步时间', dataIndex: 'lastSync' },
  { title: '操作', key: 'action', width: 180 },
]
</script>
