<template>
  <div>
    <div class="page-header">
      <h3>账号保管箱</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button type="primary" @click="showCreate = true">创建</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterStatus" placeholder="状态" style="width:120px" allowClear>
        <a-select-option value="enabled">已启用</a-select-option>
        <a-select-option value="disabled">已停用</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索" />
    </div>
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="{ pageSize: 10, total: filteredData.length, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="link-blue" @click="$router.push('/ops/account/safebox/detail')">{{ record.name }}</a>
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
import { ref, computed, onMounted } from 'vue'
import SafeBoxCreateModal from './SafeBoxCreateModal.vue'

const search = ref('')
const filterStatus = ref(null)
const selectedRowKeys = ref([])
const showCreate = ref(false)

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

const filteredData = computed(function() {
  var list = data.value
  if (search.value) {
    var kw = search.value.toLowerCase()
    list = list.filter(function(item) {
      return item.name.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)
    })
  }
  if (filterStatus.value) {
    list = list.filter(function(item) { return item.status === filterStatus.value })
  }
  return list
})

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
  { id: 1, name: 'Turnkey', status: 'enabled', statusLabel: '已启用', scope: '全部账号', permissions: '查看，修正，修改', createdAt: '2023/03/14 12:34:51', updatedAt: '2023/03/14 12:34:51', app: 'Turnkey', description: '部署、升级、扩容期间使用' },
  { id: 2, name: '兴业银行', status: 'enabled', statusLabel: '已启用', scope: '全部操作系统账号', permissions: '只读', createdAt: '2020/10/13 18:15:48', updatedAt: '2020/10/13 18:15:48', app: '兴业银行', description: '--' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/safeboxes?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          status: item.status,
          statusLabel: item.status_label,
          scope: item.scope,
          permissions: item.permissions,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          app: item.name,
          description: item.description,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
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
.filter-actions-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.filter-bar :deep(.ant-input-search) {
  flex: 1;
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

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .page-header .ant-btn { width: 100%; }
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-actions-bar .ant-btn { flex: 1; min-width: 0; }
  .filter-bar :deep(.ant-input-search) { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
