<template>
  <div>
    <div class="page-header">
      <h3>资源组</h3>
    </div>
    <div class="button-row">
      <a-button>新增资源组</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
      <a-input-search v-model:value="search" placeholder="搜索资源组名称" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">管理资源</a-button>
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
  { id: 1, name: '生产环境', desc: '生产环境所有资源', resources: 24, created: '2024-01-01' },
  { id: 2, name: '测试环境', desc: '测试环境所有资源', resources: 16, created: '2024-01-15' },
  { id: 3, name: '数据库组', desc: '所有数据库实例', resources: 8, created: '2024-03-01' },
  { id: 4, name: '网络组', desc: '网络设备及安全组', resources: 12, created: '2024-04-10' },
])
const columns = [
  { title: '组名称', dataIndex: 'name' },
  { title: '描述', dataIndex: 'desc' },
  { title: '资源数', dataIndex: 'resources', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '操作', key: 'action', width: 200 },
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
