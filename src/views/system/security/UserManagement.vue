<template>
  <div>
    <div class="page-header">
      <h3>用户</h3>
    </div>
    <div class="button-row">
      <a-button>新增用户</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
      <a-input-search v-model:value="search" placeholder="搜索用户名/姓名/邮箱" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
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

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-row { margin-bottom: 16px; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
</style>
