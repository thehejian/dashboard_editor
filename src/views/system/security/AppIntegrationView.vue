<template>
  <div>
    <div class="page-header">
      <h3>应用集成</h3>
    </div>
    <div class="button-row">
      <a-button type="primary" @click="router.push('/system/security/app-integration/create')">创建应用集成</a-button>
      <a-button>导出元数据</a-button>
      <a-button>导出配置</a-button>
    </div>
    <div class="filter-row">
      <a-select v-model:value="filterTenant" placeholder="全部租户" style="width: 160px">
        <a-select-option value="tenant01">租户01</a-select-option>
        <a-select-option value="tenant02">租户02</a-select-option>
        <a-select-option value="tenant03">租户03</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="输入关键字搜索、过滤" />
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, total: 70, showSizeChanger: true, showQuickJumper: true, showTotal: t => `总条数：${t}` }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="link-blue" @click="router.push('/system/security/app-integration/detail?id=' + record.id)">{{ record.name }}</a>
          <span v-if="record.tag" class="name-tag">{{ record.tag }}</span>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 8px">登录</a>
          <a class="link-blue" style="margin-right: 8px">导出配置</a>
          <a class="link-blue">更多 ▾</a>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const search = ref('')
const filterTenant = ref(null)
const selectedRowKeys = ref([])

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '协议', dataIndex: 'protocol', key: 'protocol' },
  { title: '所属租户', dataIndex: 'tenant', key: 'tenant' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '是否有快捷入口', dataIndex: 'hasShortcut', key: 'hasShortcut' },
  { title: '快捷入口分组', dataIndex: 'shortcutGroup', key: 'shortcutGroup' },
  { title: '操作', key: 'action', width: 200 },
]

const data = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/applications?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          protocol: item.protocol,
          tenant: item.tenant,
          status: item.status,
          statusLabel: item.status === 'active' ? '已启用' : '已停用',
          hasShortcut: item.has_shortcut,
          shortcutGroup: item.shortcut_group,
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
.page-header { margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-row { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-row .ant-input-search { flex: 1; }
.link-blue { color: var(--brand); cursor: pointer; font-size: 13px; }
.link-blue:hover { opacity: 0.8; }
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-gray { background: #d9d9d9; }
.name-tag { display: inline-block; font-size: 11px; background: var(--brand-subtle); color: var(--brand); padding: 0 6px; border-radius: 3px; margin-left: 4px; vertical-align: middle; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
</style>
