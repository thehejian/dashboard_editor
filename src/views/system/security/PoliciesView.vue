<template>
  <div>
    <div class="page-header">
      <h3>策略</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button type="primary">创建策略</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="策略类型" style="width: 160px" allowClear>
        <a-select-option value="system">系统策略</a-select-option>
        <a-select-option value="custom">自定义策略</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索策略名称" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
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
import { ref, onMounted } from 'vue'

const search = ref('')
const filterType = ref(null)
const data = ref([
  { id: 1, name: '密码策略', type: '安全策略', desc: '密码复杂度不低于8位，包含大小写字母和特殊字符', created: '2024-01-01' },
  { id: 2, name: '访问控制策略', type: '安全策略', desc: '基于角色的访问控制，最小权限原则', created: '2024-01-01' },
  { id: 3, name: '审计策略', type: '审计策略', desc: '所有操作记录审计日志，保留180天', created: '2024-01-01' },
  { id: 4, name: '数据保留策略', type: '合规策略', desc: '监控数据保留90天，日志数据保留180天', created: '2024-02-01' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/policies?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          desc: item.description,
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
  { title: '策略名称', dataIndex: 'name' },
  { title: '类型', key: 'type', width: 100 },
  { title: '描述', dataIndex: 'desc' },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 120 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; justify-content: flex-start; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }

@media (max-width: 768px) {
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-input-search) { width: 100%; }
  .filter-bar .ant-select { width: 100% !important; }
}</style>
