<template>
  <div>
    <div class="page-header">
      <h3>角色管理</h3>
      <a-button type="primary">新增角色</a-button>
    </div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="搜索角色名称" style="width: 280px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">配置权限</a-button>
          <a-button type="link" size="small">编辑</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const search = ref('')
const data = ref([
  { id: 1, name: '超级管理员', desc: '拥有所有系统权限', users: 1, created: '2024-01-01' },
  { id: 2, name: '系统运维', desc: '运维管理权限', users: 3, created: '2024-01-15' },
  { id: 3, name: '安全审计', desc: '审计与合规查看权限', users: 2, created: '2024-03-01' },
  { id: 4, name: '只读用户', desc: '仅可查看资源信息', users: 8, created: '2024-04-10' },
])
const columns = [
  { title: '角色名称', dataIndex: 'name' },
  { title: '描述', dataIndex: 'desc' },
  { title: '用户数', dataIndex: 'users', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 160 },
]
</script>
