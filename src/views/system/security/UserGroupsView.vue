<template>
  <div>
    <div class="page-header">
      <h3>用户组</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button>创建用户组</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-bar">
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
import { ref, onMounted } from 'vue'

const search = ref('')
const data = ref([
  { id: 1, name: '运维组', desc: '运维工程师团队', users: 5, created: '2024-01-01' },
  { id: 2, name: '开发组', desc: '开发工程师团队', users: 10, created: '2024-01-01' },
  { id: 3, name: '安全组', desc: '安全审计团队', users: 3, created: '2024-01-01' },
  { id: 4, name: 'DBA组', desc: '数据库管理团队', users: 2, created: '2024-02-01' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/user_groups?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          desc: item.description,
          users: item.users,
          created: item.created_at,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
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
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; justify-content: flex-end; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }

@media (max-width: 768px) {
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-input-search) { width: 100%; }
}</style>
