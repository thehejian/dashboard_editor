<template>
  <div>
    <div class="page-header">
      <h3>集成账号</h3>
    </div>
    <div class="button-row">
      <a-button>创建集成账号</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="filter-row">
      <a-select v-model:value="filterProvider" placeholder="所属提供商" style="width: 160px" allowClear>
        <a-select-option v-for="p in providers" :key="p" :value="p">{{ p }}</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索账号名称" />
    </div>
    <a-table :columns="columns" :data-source="filteredData" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status === 'active' ? '正常' : '异常' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">同步</a-button>
          <a-button type="link" size="small">编辑</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const search = ref('')
const filterProvider = ref(null)
const providers = ['企业微信', '阿里云 RAM', 'LDAP 目录服务']
const data = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/integration_accounts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          provider: item.provider,
          status: item.status,
          lastSync: item.last_sync,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
const filteredData = computed(() => data.value.filter(d =>
  (!filterProvider.value || d.provider === filterProvider.value) &&
  (!search.value || d.name.includes(search.value))
))
const columns = [
  { title: '账号名称', dataIndex: 'name' },
  { title: '所属提供商', dataIndex: 'provider' },
  { title: '状态', key: 'status', width: 80 },
  { title: '最后同步时间', dataIndex: 'lastSync' },
  { title: '操作', key: 'action', width: 180 },
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
