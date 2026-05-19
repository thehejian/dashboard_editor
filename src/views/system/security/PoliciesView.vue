<template>
  <div>
    <div class="page-header">
      <h3>策略管理</h3>
      <a-button type="primary">新增策略</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="策略类型" style="width: 140px" allowClear>
        <a-select-option value="system">系统策略</a-select-option>
        <a-select-option value="custom">自定义策略</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索策略名称" style="width: 240px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 'system' ? 'blue' : 'orange'">{{ record.type === 'system' ? '系统' : '自定义' }}</a-tag>
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
  { id: 1, name: 'AdministratorAccess', type: 'system', desc: '完全管理所有资源的权限', created: '2024-01-01' },
  { id: 2, name: 'ReadOnlyAccess', type: 'system', desc: '只读访问所有资源的权限', created: '2024-01-01' },
  { id: 3, name: 'MonitorFullAccess', type: 'custom', desc: '监控系统完全管理权限', created: '2024-03-15' },
  { id: 4, name: 'DBReadOnly', type: 'custom', desc: '数据库只读访问权限', created: '2024-05-20' },
])
const columns = [
  { title: '策略名称', dataIndex: 'name' },
  { title: '类型', key: 'type', width: 100 },
  { title: '描述', dataIndex: 'desc' },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>
