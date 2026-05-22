<template>
  <div>
    <div class="page-header">
      <h3>账号保管箱</h3>
    </div>
    <div class="button-row">
      <a-button @click="showCreate = true">创建</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="search-row">
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索" />
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, total: data.length, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot dot-green"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'app'">
          <a class="link-blue">{{ record.app }}</a>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">修改</a>
          <a class="link-blue">删除</a>
        </template>
      </template>
    </a-table>
    <SafeBoxCreateModal v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SafeBoxCreateModal from './SafeBoxCreateModal.vue'

const search = ref('')
const selectedRowKeys = ref([])
const showCreate = ref(false)

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '账号范围', dataIndex: 'scope', key: 'scope' },
  { title: '权限', dataIndex: 'permissions', key: 'permissions' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '最近修改时间', dataIndex: 'updatedAt', key: 'updatedAt', sorter: true },
  { title: '关联应用', dataIndex: 'app', key: 'app', sorter: true },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '操作', key: 'action', width: 120 },
]

const data = ref([
  {
    id: 1,
    name: 'Turnkey',
    status: 'enabled',
    statusLabel: '已启用',
    scope: '全部账号',
    permissions: '查看，修正，修改',
    createdAt: '2023/03/14 12:34:51',
    updatedAt: '2023/03/14 12:34:51',
    app: 'Turnkey',
    description: '部署、升级、扩容期间使用',
  },
  {
    id: 2,
    name: '兴业银行',
    status: 'enabled',
    statusLabel: '已启用',
    scope: '全部操作系统账号',
    permissions: '只读',
    createdAt: '2020/10/13 18:15:48',
    updatedAt: '2020/10/13 18:15:48',
    app: '兴业银行',
    description: '--',
  },
])
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.button-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.search-row {
  margin-bottom: 16px;
}
.link-blue {
  color: var(--brand);
  cursor: pointer;
  font-size: 13px;
}
.link-blue:hover {
  opacity: 0.8;
}
.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green { background: #52c41a; }
:deep(.ant-table-thead > tr > th) {
  background: var(--bg);
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
:deep(.ant-table-tbody > tr > td) {
  font-size: 13px;
}
:deep(.ant-table-tbody > tr:nth-child(even) > td) {
  background: #fafafa;
}
:deep(.ant-table-tbody > tr:hover > td) {
  background: var(--brand-subtle) !important;
}
</style>
