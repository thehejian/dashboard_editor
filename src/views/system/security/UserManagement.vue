<template>
  <div>
    <div class="page-header">
      <h3>用户管理</h3>
      <a-button type="primary">新增用户</a-button>
    </div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="搜索用户名/姓名/邮箱" style="width: 280px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-switch v-model:checked="record.enabled" size="small" />
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
const data = ref([
  { id: 1, username: 'admin', name: '管理员', email: 'admin@company.com', phone: '138****0001', role: '超级管理员', enabled: true, created: '2024-01-01' },
  { id: 2, username: 'ops1', name: '张运维', email: 'ops1@company.com', phone: '138****0002', role: '运维工程师', enabled: true, created: '2024-03-15' },
  { id: 3, username: 'dev1', name: '李开发', email: 'dev1@company.com', phone: '138****0003', role: '开发工程师', enabled: false, created: '2024-06-20' },
])
const columns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '姓名', dataIndex: 'name' },
  { title: '邮箱', dataIndex: 'email' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '角色', dataIndex: 'role' },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>
