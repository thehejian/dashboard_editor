<template>
  <div class="resource-monitor">
    <div class="monitor-header">
      <a-tabs
        :active-key="mainTab"
        size="small"
        class="category-tabs"
        @change="onTabClick"
      >
        <a-tab-pane v-for="tab in mainTabs" :key="tab.key" :tab="tab.label" />
      </a-tabs>
      <div class="header-actions">
        <a-button type="text" size="small" @click="statsCollapsed = !statsCollapsed">
          <i class="fa-solid" :class="statsCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
          {{ statsCollapsed ? '展开' : '收起' }}
        </a-button>
        <a-radio-group v-model:value="viewMode" size="small" @change="onViewModeChange">
          <a-radio-button value="list"><i class="fa-solid fa-list"></i> 列表</a-radio-button>
          <a-radio-button value="card"><i class="fa-solid fa-table-cells-large"></i> 卡片</a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <div class="alert-cards" v-show="!statsCollapsed">
      <div class="alert-card" v-for="item in alertCards" :key="item.label">
        <div class="card-body">
          <div class="card-info">
            <div class="card-number">
              <span class="num-alert" :class="{ zero: item.alertCount === 0 }">{{ item.alertCount }}</span>
              <span class="num-total">/{{ item.total }}</span>
            </div>
            <div class="card-label">{{ item.label }}</div>
          </div>
          <div class="card-icon-wrap" :style="{ background: item.iconBg }">
            <i :class="item.icon"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="sub-tabs" v-if="mainTab !== 'all'">
      <a-tabs
        :active-key="'sub-' + subActive"
        size="small"
        class="sub-category-tabs"
        @change="onSubTabChange"
      >
        <a-tab-pane v-for="(st, i) in subTabs" :key="'sub-' + i">
          <template #tab>
            <span>{{ st.label }}</span>
            <i v-if="st.more" class="fa-solid fa-filter"></i>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <div class="table-section">
      <div class="table-toolbar">
        <a-input
          v-model:value="searchText"
          placeholder="输入关键字搜索、过滤"
          allow-clear
        />
      </div>

      <div v-if="viewMode === 'card'" class="card-groups">
        <div class="card-group" v-for="group in cardGroupsComputed" :key="group.key">
          <div class="group-header" @click="toggleGroup(group.key)">
            <i class="fa-solid group-arrow" :class="groupCollapsed[group.key] ? 'fa-chevron-right' : 'fa-chevron-down'"></i>
            <i :class="group.icon" class="group-icon"></i>
            <span class="group-title">{{ group.label }}</span>
            <span class="group-badge" :class="{ alert: group.alertCount > 0 }">告警 {{ group.alertCount }}</span>
            <span class="group-total">共 {{ group.items.length }} 个</span>
          </div>
          <div class="carousel-wrap" v-show="!groupCollapsed[group.key]">
            <div class="card-grid" :ref="el => carouselRef(group.key, el)" :style="{ transform: `translateX(${carouselOffset[group.key] || 0}px)` }">
              <div class="res-card" v-for="record in group.items" :key="record.id" @click="openDetail(record)">
                <div class="res-icon" :class="{ alert: record.alertStatus === '紧急' }">
                  <i :class="group.icon"></i>
                </div>
                <div class="res-info">
                  <div class="res-name">{{ record.name }}</div>
                  <div class="res-alert">
                    <template v-if="record.alertStatus === '紧急'">
                      <span class="alert-count">紧急 {{ getEmergencyCount(record) }}</span>
                    </template>
                    <template v-else>
                      <span class="alert-label">运行正常</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <template v-if="carouselNeeds[group.key]">
              <button class="carousel-btn carousel-prev" @click.stop="moveCarousel(group.key, -1)"><i class="fa-solid fa-chevron-left"></i></button>
              <button class="carousel-btn carousel-next" @click.stop="moveCarousel(group.key, 1)"><i class="fa-solid fa-chevron-right"></i></button>
            </template>
          </div>
        </div>
      </div>

      <a-table
        v-else
        :columns="columns"
        :data-source="filteredData"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: total => '共 ' + total + ' 条' }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a class="app-link" href="javascript:;" @click="openDetail(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'alertStatus'">
            <template v-if="record.alertStatus === '紧急'">
              <span class="alert-count">紧急 {{ getEmergencyCount(record) }}</span>
            </template>
            <template v-else>
              <span class="alert-label">正常</span>
            </template>
          </template>
          <template v-if="column.key === 'runStatus'">
            <span class="run-status"><span class="dot-green"></span> 运行中</span>
          </template>
          <template v-if="column.key === 'storageSize'">
            <span>{{ record.storageSize || '--' }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <ResourceDetailPanel />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useResourceDetail } from '../../composables/useResourceDetail'
import { ALARM_MOCK } from '../../mock/resourceDetailMock'
import { subTabMap, mainTabs, appData, cloudServiceData, cloudResData, virtualData, physicalData } from '../../data/resourceData'
import ResourceDetailPanel from './ResourceDetailPanel.vue'

const props = defineProps({
  mode: { type: String, default: 'list' },
})
const router = useRouter()

const { state: rdpState, openDetail: rdpOpen } = useResourceDetail()

const searchText = ref('')
const mainTab = ref('all')
const subActive = ref(0)
const viewMode = ref('card')
const statsCollapsed = ref(true)
const groupCollapsed = reactive({})

const carouselOffset = reactive({})
const carouselRefs = {}
const carouselNeeds = reactive({})

const carouselRef = (key, el) => {
  if (el) {
    carouselRefs[key] = el
    nextTick(() => {
      carouselNeeds[key] = el.scrollWidth > el.clientWidth + 2
    })
  }
}

const moveCarousel = (key, dir) => {
  const el = carouselRefs[key]
  if (!el) return
  const step = el.clientWidth * 0.75
  const maxOffset = el.scrollWidth - el.clientWidth
  const cur = carouselOffset[key] || 0
  const next = Math.max(-maxOffset, Math.min(0, cur - dir * step))
  carouselOffset[key] = next
}

const syncFromRoute = () => {
  const mode = props.mode || 'list'
  if (mode === 'card') {
    mainTab.value = 'all'
    viewMode.value = 'card'
  } else if (mode === 'app') {
    mainTab.value = 'app'
    viewMode.value = 'list'
  } else {
    mainTab.value = 'all'
    viewMode.value = 'list'
  }
  subActive.value = 0
}
watch(() => props.mode, syncFromRoute)
syncFromRoute()

const onTabClick = (key) => {
  mainTab.value = key
  subActive.value = 0
  if (key === 'all') {
    router.push('/monitor/resource/' + viewMode.value)
  }
}

const onViewModeChange = () => {
  if (mainTab.value === 'all') {
    router.push('/monitor/resource/' + viewMode.value)
  }
}

const toggleGroup = (key) => {
  groupCollapsed[key] = !groupCollapsed[key]
}

const onSubTabChange = (key) => {
  const idx = Number(String(key).replace('sub-', ''))
  subActive.value = isNaN(idx) ? 0 : idx
}

const subTabs = computed(() => subTabMap[mainTab.value] || subTabMap.all)

const alertCards = [
  { label: '应用', alertCount: 3, total: 100, icon: 'fa-solid fa-circle-nodes', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '云服务', alertCount: 1, total: 100, icon: 'fa-solid fa-cloud', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '云资源', alertCount: 3, total: 100, icon: 'fa-solid fa-server', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '虚拟资源池', alertCount: 0, total: 100, icon: 'fa-solid fa-layer-group', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '物理资源', alertCount: 3, total: 100, icon: 'fa-solid fa-microchip', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
]

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 120, sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: '告警状态', dataIndex: 'alertStatus', key: 'alertStatus', width: 120, sorter: true, filters: [{ text: '紧急', value: '紧急' }, { text: '正常', value: '正常' }], onFilter: (value, record) => record.alertStatus === value },
  { title: '标识', dataIndex: 'identifier', key: 'identifier', width: 150, sorter: true },
  { title: '运行状态', dataIndex: 'runStatus', key: 'runStatus', width: 120, sorter: true, filters: [{ text: '运行中', value: '运行中' }, { text: '已停止', value: '已停止' }], onFilter: (value, record) => record.runStatus === value },
  { title: '应用级别', dataIndex: 'appLevel', key: 'appLevel', width: 120, sorter: true },
  { title: '存储量', dataIndex: 'storageSize', key: 'storageSize', width: 100, sorter: true },
  { title: '所属VDC', dataIndex: 'vdc', key: 'vdc', width: 120, sorter: true },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100, sorter: true },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100, sorter: true },
]

const getEmergencyCount = (record) => {
  const count = ALARM_MOCK.filter(a => a.resource === record.name && a.level === 'critical').length
  return count > 0 ? count : (record.alertStatus === '紧急' ? 1 : 0)
}

const openDetail = (app) => {
  rdpOpen(app)
}
const getMetricColor = (value) => {
  if (value >= 80) return '#f5222d'
  if (value >= 50) return '#fa8c16'
  return '#52c41a'
}

const currentSubType = computed(() => {
  if (mainTab.value === 'all') return null
  const tab = subTabs.value[subActive.value]
  return tab?.subType || null
})

const filteredData = computed(() => {
  let base
  if (mainTab.value === 'all') base = [...appData, ...cloudServiceData, ...cloudResData, ...virtualData, ...physicalData]
  else if (mainTab.value === 'app') base = appData
  else if (mainTab.value === 'cloud') base = cloudServiceData
  else if (mainTab.value === 'cloud-resource') base = cloudResData
  else if (mainTab.value === 'virtual') base = virtualData
  else if (mainTab.value === 'physical') base = physicalData
  else base = appData
  if (currentSubType.value) {
    base = base.filter(item => item.subType === currentSubType.value)
  }
  if (!searchText.value) return base
  const kw = searchText.value.toLowerCase()
  return base.filter(item =>
    item.name.toLowerCase().includes(kw) || (item.identifier || '').toLowerCase().includes(kw)
  )
})

const cardGroups = [
  { key: 'app', label: '业务应用', icon: 'fa-solid fa-circle-nodes', items: appData },
  { key: 'cloud', label: '云服务', icon: 'fa-solid fa-cloud', items: cloudServiceData },
  { key: 'cloud-resource', label: '云资源', icon: 'fa-solid fa-server', items: cloudResData },
  { key: 'virtual', label: '虚拟资源池', icon: 'fa-solid fa-layer-group', items: virtualData },
  { key: 'physical', label: '物理资源', icon: 'fa-solid fa-microchip', items: physicalData },
]

const cardGroupsComputed = computed(() => {
  let groups = cardGroups
  if (mainTab.value !== 'all') {
    groups = cardGroups.filter(g => g.key === mainTab.value)
  }
  return groups.map(g => {
    let items = g.items
    if (currentSubType.value) {
      items = items.filter(item => item.subType === currentSubType.value)
    }
    items = items
      .filter(item =>
        !searchText.value || item.name.toLowerCase().includes(searchText.value.toLowerCase()) || (item.identifier || '').toLowerCase().includes(searchText.value.toLowerCase())
      )
      .sort((a, b) => (b.alertStatus === '紧急' ? 1 : 0) - (a.alertStatus === '紧急' ? 1 : 0))
    const alertCount = items.filter(item => item.alertStatus === '紧急').length
    return { ...g, items, alertCount }
  })
})

const loading = ref(false)

onMounted(async function() {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/ci?ci_type_id=5&sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      const apiData = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          alertStatus: '正常',
          identifier: item.identifier,
          runStatus: '运行中',
          appLevel: item.app_level,
          storageSize: '--',
          vdc: item.vdc,
          owner: item.owner,
          source: item.source,
          type: 'app',
          metrics: {
            cpu: item.metadata && item.metadata.cpu || 45,
            memory: item.metadata && item.metadata.memory || 60,
            requests: 500,
            errorRate: 0.5,
            responseTime: 50,
            connections: 60,
          },
        }
      })
      // merge API data into appData
      appData.splice(0, appData.length, ...apiData)
    }
  } catch (e) {
    console.error('加载资源监控数据失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.resource-monitor {
  padding: 0 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.monitor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0 8px;
}
.monitor-header .category-tabs {
  flex: 1;
  min-width: 0;
}
.monitor-header :deep(.category-tabs .ant-tabs-nav) {
  margin-bottom: 0;
}
.monitor-header :deep(.category-tabs .ant-tabs-nav::before) {
  border-bottom: none;
}
.monitor-header :deep(.category-tabs .ant-tabs-tab) {
  font-size: 14px;
}

.alert-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.alert-card {
  flex: 1;
  background: linear-gradient(135deg, #f0f9ff, #e0f0fe);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}
.alert-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}
.card-group {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 16px;
}
.group-arrow {
  font-size: 12px;
  color: #8c8c8c;
  width: 12px;
}
.group-icon {
  font-size: 16px;
  color: #1890ff;
  width: 20px;
  text-align: center;
}
.group-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.group-badge {
  font-size: 12px;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 10px;
  padding: 1px 10px;
}
.group-badge.alert {
  color: #f5222d;
  background: rgba(245, 34, 45, 0.1);
}
.group-total {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8c;
}

.card-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: repeat(auto-fill, 210px);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
}
.carousel-wrap {
  position: relative;
  overflow: hidden;
  max-height: 128px;
}
.carousel-wrap:hover .carousel-btn { opacity: 1; }
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: rgba(255,255,255,0.92);
  color: #666;
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.carousel-btn:hover { background: #fff; color: #1890ff; border-color: #1890ff; }
.carousel-prev { left: 6px; }
.carousel-next { right: 6px; }
.res-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.res-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #1890ff;
}
.res-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.res-icon.alert {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}
.res-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.res-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-alert {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alert-label { color: #8c8c8c; }
.alert-count { color: #f5222d; font-weight: 500; }

.card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-number {
  line-height: 1;
  margin-bottom: 8px;
}
.num-alert {
  font-size: 32px;
  font-weight: 700;
  color: #f5222d;
}
.num-alert.zero {
  color: #1a1a1a;
}
.num-total {
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 2px;
}
.card-label {
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

.card-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-icon-wrap i {
  font-size: 22px;
  color: #fff;
}

.sub-tabs {
  margin-bottom: 16px;
}
.sub-category-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
.sub-category-tabs :deep(.ant-tabs-nav::before) {
  border-bottom: none;
}
.sub-category-tabs :deep(.ant-tabs-tab) {
  font-size: 13px;
  color: #8c8c8c;
}
.sub-category-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1890ff;
  font-weight: 500;
}
.sub-category-tabs :deep(.ant-tabs-ink-bar) {
  background: #1890ff;
}
.sub-category-tabs i {
  margin-left: 4px;
  font-size: 11px;
}

.table-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-toolbar {
  margin-bottom: 16px;
}

:deep(.ant-table-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.ant-table) {
  flex: 1;
  min-height: 0;
}
:deep(.ant-table-container) {
  flex: 1;
  min-height: 0;
}

.app-link {
  color: #1890ff;
  text-decoration: none;
}
.app-link:hover {
  text-decoration: underline;
}

.status-tag i {
  margin-right: 4px;
}
.status-tag.emergency {
  color: #f5222d;
  font-weight: 500;
}
.status-tag.normal {
  color: #52c41a;
  font-weight: 500;
}

.run-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #52c41a;
}
.dot-green {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52c41a;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metric-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
}
.metric-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}
.metric-bar {
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}
.metric-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

@media (max-width: 768px) {
  .resource-monitor { padding: 0 16px; }
  .monitor-header { padding: 12px 0; flex-wrap: wrap; }
  .monitor-header .header-actions { width: 100%; }
  .alert-cards { flex-wrap: wrap; }
  .alert-card { min-width: calc(50% - 8px); flex: none; }
  .sub-tabs { overflow-x: auto; }
  .table-section { padding: 12px; }
  .metric-grid { grid-template-columns: 1fr; }
  .carousel-wrap { max-height: 154px; }
}
</style>
