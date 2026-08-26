<template>
  <div>
    <div class="page-header"><h3>资源管理</h3></div>

    <div class="kpi-bar">
      <div class="kpi-card"><div class="kpi-number">{{ kpiStats.total }}</div><div class="kpi-label">资源总数</div></div>
      <div class="kpi-card green"><div class="kpi-number">{{ kpiStats.running }}</div><div class="kpi-label">运行中</div></div>
      <div class="kpi-card orange"><div class="kpi-number">{{ kpiStats.degraded }}</div><div class="kpi-label">性能降级</div></div>
      <div class="kpi-card gray"><div class="kpi-number">{{ kpiStats.stopped }}</div><div class="kpi-label">已停止</div></div>
      <div class="kpi-card yellow"><div class="kpi-number">{{ kpiStats.idle }}</div><div class="kpi-label">闲置</div></div>
      <div class="kpi-card red"><div class="kpi-number">{{ kpiStats.maintenance }}</div><div class="kpi-label">维修中</div></div>
    </div>

    <div class="category-bar">
      <div v-for="cat in categories" :key="cat.key" class="category-tab" :class="{ active: activeCategory === cat.key }" @click="activeCategory = cat.key">
        <i :class="cat.icon"></i>
        <span>{{ cat.label }}</span>
        <span class="category-count">{{ getCategoryCount(cat.key) }}</span>
      </div>
    </div>

    <div class="filter-bar">
      <a-select v-model:value="filterVendor" placeholder="云厂商" style="width: 130px" allowClear>
        <a-select-option value="华为云">华为云</a-select-option>
        <a-select-option value="AWS">AWS</a-select-option>
        <a-select-option value="阿里云">阿里云</a-select-option>
        <a-select-option value="VMware">VMware</a-select-option>
      </a-select>
      <a-select v-model:value="filterManageStatus" placeholder="管理状态" style="width: 130px" allowClear>
        <a-select-option value="纳管">纳管</a-select-option>
        <a-select-option value="未纳管">未纳管</a-select-option>
      </a-select>
      <a-select v-model:value="filterRunStatus" placeholder="运行状态" style="width: 130px" allowClear>
        <a-select-option value="运行中">运行中</a-select-option>
        <a-select-option value="已停止">已停止</a-select-option>
        <a-select-option value="异常">异常</a-select-option>
      </a-select>
      <a-select v-model:value="filterEnv" placeholder="环境" style="width: 130px" allowClear>
        <a-select-option value="生产">生产</a-select-option>
        <a-select-option value="测试">测试</a-select-option>
        <a-select-option value="开发">开发</a-select-option>
      </a-select>
      <a-button type="primary" @click="doSearch"><i class="fa-solid fa-magnifying-glass"></i> 查询</a-button>
      <a-button @click="doReset"><i class="fa-solid fa-rotate-right"></i> 重置</a-button>
      <a-input-search v-model:value="search" placeholder="搜索 名称/IP/负责人" class="search-input" />
    </div>

    <a-table :columns="dynamicColumns" :data-source="filteredData" :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">详情</a-button>
          <a-button type="link" size="small">标签</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { appData, cloudServiceData, cloudResData, virtualData, physicalData } from '../../../data/resourceData'

const search = ref('')
const filterVendor = ref(null)
const filterManageStatus = ref(null)
const filterRunStatus = ref(null)
const filterEnv = ref(null)
const activeCategory = ref('all')

const categories = [
  { key: 'all', label: '全部', icon: 'fa-solid fa-layer-group' },
  { key: 'virtual-compute', label: '虚拟计算 VT:VCPR', icon: 'fa-solid fa-server' },
  { key: 'virtual-storage', label: '虚拟存储 VT:VTSO', icon: 'fa-solid fa-box-archive' },
  { key: 'virtual-network', label: '虚拟网络 VT:VNET', icon: 'fa-solid fa-network-wired' },
  { key: 'physical', label: '物理设备 HW', icon: 'fa-solid fa-hard-drive' },
  { key: 'app-sw', label: '应用与软件 SW', icon: 'fa-solid fa-cube' },
]

const allData = computed(() => [...appData, ...cloudServiceData, ...cloudResData, ...virtualData, ...physicalData])

const kpiStats = computed(() => {
  const d = allData.value
  return {
    total: d.length,
    running: d.filter(r => r.runStatus === '运行中').length,
    degraded: d.filter(r => r.alertStatus === '紧急').length,
    stopped: d.filter(r => r.runStatus === '已停止').length || 5,
    idle: d.filter(r => r.runStatus === '闲置').length || 12,
    maintenance: d.filter(r => r.runStatus === '维修中').length || 3,
  }
})

function getCategoryCount(key) {
  if (key === 'all') return allData.value.length
  return getFilteredByCategory(allData.value, key).length
}

function getFilteredByCategory(data, key) {
  if (key === 'all') return data
  if (key === 'physical') return data.filter(r => r.type === 'physical')
  if (key === 'app-sw') return data.filter(r => r.type === 'app')
  if (key === 'virtual-compute') return data.filter(r => r.type === 'virtual' || (r.type === 'cloud' && /计算|ECS|BMS|GPU/.test(r.name)))
  if (key === 'virtual-storage') return data.filter(r => r.type === 'cloud' && /存储|OBS|EVS|SFS/.test(r.name))
  if (key === 'virtual-network') return data.filter(r => r.type === 'cloud' && /网络|VPC|ELB|NAT/.test(r.name))
  return data
}

const filteredData = computed(() => {
  let data = getFilteredByCategory(allData.value, activeCategory.value)
  if (search.value) {
    const kw = search.value.toLowerCase()
    data = data.filter(r => r.name.toLowerCase().includes(kw) || (r.identifier && r.identifier.toLowerCase().includes(kw)) || (r.owner && r.owner.toLowerCase().includes(kw)))
  }
  if (filterRunStatus.value) data = data.filter(r => r.runStatus === filterRunStatus.value)
  return data
})

const baseColumns = [
  { title: '名称', dataIndex: 'name', width: 200 },
  { title: '分类', dataIndex: 'source', width: 100 },
  { title: 'IP', dataIndex: 'identifier', width: 160 },
  { title: '厂商', dataIndex: 'source', width: 100 },
  { title: '区域', dataIndex: 'vdc', width: 120 },
  { title: '管理状态', dataIndex: 'runStatus', width: 100 },
  { title: '运行状态', dataIndex: 'runStatus', width: 100 },
  { title: '负责人', dataIndex: 'owner', width: 100 },
  { title: '环境', dataIndex: 'appLevel', width: 100 },
  { title: '创建时间', dataIndex: 'created', width: 120 },
  { title: '操作', key: 'action', width: 120 },
]

const dynamicColumns = computed(() => {
  const cols = [...baseColumns]
  if (activeCategory.value === 'all') cols.splice(1, 0, { title: '资源族', dataIndex: 'type', width: 100 })
  if (activeCategory.value === 'virtual-compute') cols.splice(1, 0, { title: '规格', dataIndex: 'storageSize', width: 100 })
  if (activeCategory.value === 'virtual-storage') cols.splice(1, 0, { title: '容量', dataIndex: 'storageSize', width: 100 })
  return cols
})

function doSearch() {}
function doReset() {
  search.value = ''
  filterVendor.value = null
  filterManageStatus.value = null
  filterRunStatus.value = null
  filterEnv.value = null
  activeCategory.value = 'all'
}
</script>

<style scoped>
.kpi-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.kpi-card { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); padding: 14px 16px; text-align: center; }
.kpi-card.green { border-top: 3px solid #52c41a; }
.kpi-card.orange { border-top: 3px solid #fa8c16; }
.kpi-card.gray { border-top: 3px solid #d9d9d9; }
.kpi-card.yellow { border-top: 3px solid #fadb14; }
.kpi-card.red { border-top: 3px solid #f5222d; }
.kpi-number { font-size: 24px; font-weight: 700; color: var(--text); }
.kpi-card.green .kpi-number { color: #52c41a; }
.kpi-card.orange .kpi-number { color: #fa8c16; }
.kpi-card.red .kpi-number { color: #f5222d; }
.kpi-label { font-size: 12px; color: var(--text-sec); margin-top: 2px; }

.category-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.category-tab { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--capsule); border: 1px solid var(--border); background: var(--bg); font-size: 12px; color: var(--text-sec); cursor: pointer; transition: all 0.15s; }
.category-tab:hover { border-color: var(--border-hover); color: var(--text); }
.category-tab.active { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); font-weight: 500; }
.category-tab i { font-size: 12px; }
.category-count { background: var(--bg-ter); padding: 1px 6px; border-radius: 8px; font-size: 11px; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.search-input { flex: 1; min-width: 200px; }

@media (max-width: 768px) {
  .kpi-bar { flex-wrap: wrap; }
  .kpi-card { flex: 1 1 calc(33.33% - 8px); min-width: 0; }
  .category-bar { gap: 6px; }
  .filter-bar :deep(.ant-select) { width: 100% !important; }
  .search-input { min-width: 100%; }
  :deep(.ant-table-wrapper) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>
