<template>
  <div>
    <div class="page-header">
      <h3>用户组</h3>
    </div>
    <div class="button-row">
      <a-button>创建用户组</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
      <a-input-search v-model:value="search" placeholder="搜索组名称" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
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
