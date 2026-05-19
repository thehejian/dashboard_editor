<template>
  <div>
    <div class="page-header">
      <h3>用户组管理</h3>
      <a-button type="primary">新增用户组</a-button>
    </div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="搜索组名称" style="width: 280px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
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
  { id: 1, name: '运维组', desc: '系统运维团队', users: 5, created: '2024-01-01' },
  { id: 2, name: '开发组', desc: '应用开发团队', users: 12, created: '2024-01-15' },
  { id: 3, name: '安全组', desc: '安全审计团队', users: 3, created: '2024-03-01' },
  { id: 4, name: 'DBA组', desc: '数据库管理团队', users: 2, created: '2024-04-10' },
])
const columns = [
  { title: '组名称', dataIndex: 'name' },
  { title: '描述', dataIndex: 'desc' },
  { title: '用户数', dataIndex: 'users', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>
