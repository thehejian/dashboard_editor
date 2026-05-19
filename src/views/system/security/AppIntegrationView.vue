<template>
  <div>
    <div class="page-header">
      <h3>应用集成管理</h3>
      <a-button type="primary">新增应用</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="应用类型" style="width: 140px" allowClear>
        <a-select-option value="web">Web 应用</a-select-option>
        <a-select-option value="api">API 服务</a-select-option>
        <a-select-option value="cli">CLI 工具</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索应用名称" style="width: 240px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status === 'active' ? '已启用' : '已禁用' }}</a-tag>
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
  { id: 1, name: '运维管理平台', type: 'web', appKey: 'app-ops-001', status: 'active', created: '2024-01-15' },
  { id: 2, name: '数据同步服务', type: 'api', appKey: 'app-sync-002', status: 'active', created: '2024-03-20' },
  { id: 3, name: 'CLI 部署工具', type: 'cli', appKey: 'app-cli-003', status: 'disabled', created: '2024-06-01' },
])
const columns = [
  { title: '应用名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: 'AppKey', dataIndex: 'appKey' },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>
