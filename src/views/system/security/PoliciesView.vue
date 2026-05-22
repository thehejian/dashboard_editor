<template>
  <div>
    <div class="page-header">
      <h3>策略</h3>
    </div>
    <div class="button-row">
      <a-button>创建策略</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
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

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-row { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-row .ant-input-search { flex: 1; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
</style>
