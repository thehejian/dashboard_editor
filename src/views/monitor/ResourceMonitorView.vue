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
        <a-radio-group v-if="mainTab === 'all'" v-model:value="viewMode" size="small" @change="onViewModeChange">
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

    <div class="monitor-body">
      <aside class="filter-panel" v-if="mainTab === 'all'" :class="{ collapsed: filterState.panelCollapsed }">
        <div class="filter-panel-inner" v-if="!filterState.panelCollapsed">
          <div class="filter-panel-head">
            <span class="filter-panel-title">过滤器</span>
            <div class="filter-panel-head-actions">
              <a-button size="small" type="link" @click="resetFilters">重置</a-button>
              <button class="filter-collapse-btn" @click="filterState.panelCollapsed = !filterState.panelCollapsed" title="收起过滤器">
                <i class="fa-solid fa-angles-left"></i>
              </button>
            </div>
          </div>

          <div class="filter-section">
            <div class="filter-section-title">资源范围</div>
            <div class="filter-scope-list">
              <div
                class="filter-scope-item"
                :class="{ active: filterState.scope === 'all' }"
                @click="setScope('all')"
              >
                <i class="fa-solid fa-boxes-stacked"></i>
                <span>全部资源</span>
                <span class="filter-scope-count">{{ totalResourceCount }}</span>
              </div>
              <div
                class="filter-scope-item"
                :class="{ active: filterState.scope === 'focused' }"
                @click="setScope('focused')"
              >
                <i class="fa-solid fa-star"></i>
                <span>关注资源</span>
                <span class="filter-scope-count">{{ filterState.focused.length }}</span>
              </div>
              <div
                class="filter-scope-item"
                :class="{ active: filterState.scope === 'recent' }"
                @click="setScope('recent')"
              >
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>最近访问</span>
                <span class="filter-scope-count">{{ filterState.recent.length }}</span>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <div class="filter-section-title">模块</div>
            <div class="filter-check-list">
              <div
                class="filter-check-item"
                v-for="g in cardGroups"
                :key="g.key"
                :class="{ active: filterState.modules.includes(g.key) }"
                @click="toggleModule(g.key)"
              >
                <span class="filter-check-box"><i class="fa-solid fa-check"></i></span>
                <i :class="g.icon" class="filter-check-icon"></i>
                <span class="filter-check-label">{{ g.label }}</span>
                <span class="filter-check-count">{{ groupCount(g.key) }}</span>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <div class="filter-section-title">告警状态</div>
            <div class="filter-check-list">
              <div
                class="filter-check-item"
                v-for="a in alertStatusOptions"
                :key="a.value"
                :class="{ active: filterState.alerts.includes(a.value) }"
                @click="toggleAlert(a.value)"
              >
                <span class="filter-check-box"><i class="fa-solid fa-check"></i></span>
                <i :class="a.icon" class="filter-check-icon" :style="{ color: a.color }"></i>
                <span class="filter-check-label">{{ a.label }}</span>
                <span class="filter-check-count">{{ alertStatusCount(a.value) }}</span>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <div class="filter-section-title">运行状态</div>
            <div class="filter-check-list">
              <div
                class="filter-check-item"
                v-for="r in runStatusOptions"
                :key="r.value"
                :class="{ active: filterState.runs.includes(r.value) }"
                @click="toggleRun(r.value)"
              >
                <span class="filter-check-box"><i class="fa-solid fa-check"></i></span>
                <i :class="r.icon" class="filter-check-icon" :style="{ color: r.color }"></i>
                <span class="filter-check-label">{{ r.label }}</span>
                <span class="filter-check-count">{{ runStatusCount(r.value) }}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          v-else
          class="filter-expand-btn"
          @click="filterState.panelCollapsed = !filterState.panelCollapsed"
          title="展开过滤器"
        >
          <i class="fa-solid fa-angles-right"></i>
        </button>
      </aside>

      <div class="table-section">
      <div class="table-toolbar" v-if="viewMode === 'list'">
        <a-input
          v-model:value="searchText"
          placeholder="输入关键字搜索、过滤"
          allow-clear
        />
      </div>

      <div class="recent-bar" v-if="mainTab === 'all' && viewMode === 'card' && filterState.scope === 'all' && filterState.recent.length">
        <div class="recent-bar-head">
          <span class="recent-bar-title"><i class="fa-solid fa-clock-rotate-left"></i> 最近访问</span>
          <a class="recent-clear" href="javascript:;" @click="clearRecent">清空</a>
        </div>
        <div class="recent-list">
          <div class="recent-item" v-for="r in filterState.recent" :key="r.id" @click="openRecent(r)">
            <i class="fa-solid fa-circle" :class="r.alertStatus === '紧急' ? 'recent-dot-alert' : 'recent-dot-ok'"></i>
            <span class="recent-name">{{ r.name }}</span>
            <span class="recent-time">{{ relativeTime(r.time) }}</span>
            <i
              class="fa-solid fa-star recent-star"
              :class="{ active: isFocused(r.id) }"
              @click.stop="toggleFocusById(r)"
            ></i>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'card' && filterState.scope === 'recent'" class="recent-view">
        <div class="recent-view-head">
          <span class="recent-view-title">最近访问</span>
          <a class="recent-clear" href="javascript:;" @click="clearRecent">清空</a>
        </div>
        <a-table
          :columns="recentColumns"
          :data-source="recentRows"
          :pagination="false"
          size="small"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a class="app-link" href="javascript:;" @click="openRecent(record)">{{ record.name }}</a>
            </template>
            <template v-else-if="column.key === 'alertStatus'">
              <span :class="record.alertStatus === '紧急' ? 'alert-count' : 'alert-label'">{{ record.alertStatus }}</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <i
                class="fa-solid fa-star recent-star"
                :class="{ active: isFocused(record.id) }"
                @click.stop="toggleFocusById(record)"
              ></i>
            </template>
          </template>
        </a-table>
        <div v-if="!filterState.recent.length" class="filter-empty">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <p>暂无最近访问记录</p>
        </div>
      </div>

      <div v-else-if="viewMode === 'card'" class="card-groups">
        <div class="card-group" v-for="group in cardGroupsComputed" :key="group.key" v-show="group.total > 0">
          <div class="group-header">
            <i :class="group.icon" class="group-icon"></i>
            <span class="group-title">{{ group.label }}</span>
            <span class="group-badge" :class="{ alert: group.alertCount > 0 }">告警 {{ group.alertCount }}</span>
            <span class="group-total">共 {{ group.total }} 个</span>
            <button
              class="group-focus-btn"
              :class="{ active: isGroupFocused(group.key) }"
              @click.stop="toggleGroupFocus(group)"
              title="关注此分组"
            >
              <i class="fa-solid fa-star"></i>
            </button>
          </div>
          <div class="sub-card-grid">
            <div class="sub-card" v-for="sub in group.subCards" :key="sub.subType" @click="gotoSubTab(group, sub)">
              <div class="sub-card-icon" :class="{ alert: sub.alertCount > 0 }">
                <i :class="group.icon"></i>
              </div>
              <div class="sub-card-info">
                <div class="sub-card-name">{{ sub.label }}</div>
                <div class="sub-card-alert">
                  <template v-if="sub.alertCount > 0">
                    <span class="alert-count">有告警 {{ sub.alertCount }}</span>
                  </template>
                  <template v-else>
                    <span class="alert-label">运行正常</span>
                  </template>
                </div>
              </div>
              <span class="sub-card-total">{{ sub.count }} 个</span>
            </div>
          </div>
        </div>
        <div v-if="!cardGroupsComputed.some(g => g.total > 0)" class="filter-empty">
          <i class="fa-solid fa-filter-circle-xmark"></i>
          <p>没有符合条件的资源</p>
          <a-button size="small" @click="resetFilters">重置过滤器</a-button>
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
            <span class="row-focus" @click.stop="toggleFocusById(record)">
              <i class="fa-solid fa-star" :class="isFocused(record.id) ? 'on' : 'off'"></i>
            </span>
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
    </div>

    <ResourceDetailPanel />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResourceDetail } from '../../composables/useResourceDetail'
import { useResourceFilters } from '../../composables/useResourceFilters'
import { ALARM_MOCK } from '../../mock/resourceDetailMock'
import { subTabMap, mainTabs, appData, cloudServiceData, cloudResData, virtualData, physicalData } from '../../data/resourceData'
import ResourceDetailPanel from './ResourceDetailPanel.vue'

const props = defineProps({
  mode: { type: String, default: 'list' },
})
const router = useRouter()

const { state: rdpState, openDetail: rdpOpen } = useResourceDetail()
const {
  state: filterState,
  setScope,
  toggleModule,
  toggleAlert,
  toggleRun,
  isFocused,
  toggleFocus,
  isGroupFocused,
  toggleGroupFocus,
  recordVisit,
  clearRecent,
  resetFilters,
} = useResourceFilters()

const searchText = ref('')
const mainTab = ref('all')
const subActive = ref(0)
const viewMode = ref('card')
const statsCollapsed = ref(true)

const mainTabKeys = ['all', 'app', 'cloud', 'cloud-resource', 'virtual', 'physical']

const syncFromRoute = () => {
  const mode = props.mode || 'list'
  const querySub = router.currentRoute.value.query.sub
  if (mode === 'card' || mode === 'list' || mode === 'all') {
    mainTab.value = 'all'
    viewMode.value = mode === 'card' ? 'card' : 'list'
  } else if (mainTabKeys.includes(mode)) {
    mainTab.value = mode
    viewMode.value = 'list'
  } else {
    mainTab.value = 'all'
    viewMode.value = 'list'
  }
  subActive.value = 0
  if (mainTab.value !== 'all' && querySub) {
    const tabs = subTabMap[mainTab.value] || []
    const idx = tabs.findIndex(t => t.subType === querySub)
    if (idx >= 0) subActive.value = idx
  }
}
watch(() => props.mode, syncFromRoute)
watch(() => router.currentRoute.value.query.sub, syncFromRoute)
syncFromRoute()

const onTabClick = (key) => {
  mainTab.value = key
  subActive.value = 0
  if (key === 'all') {
    router.push('/monitor/resource/card')
  } else {
    router.push('/monitor/resource/' + key)
  }
}

const onViewModeChange = () => {
  if (mainTab.value === 'all') {
    router.push('/monitor/resource/' + viewMode.value)
  }
}

const gotoSubTab = (group, sub) => {
  searchText.value = ''
  router.push({
    path: '/monitor/resource/' + group.key,
    query: { sub: sub.subType },
  })
}

const onSubTabChange = (key) => {
  const idx = Number(String(key).replace('sub-', ''))
  subActive.value = isNaN(idx) ? 0 : idx
  if (mainTab.value !== 'all') {
    const tab = subTabs.value[subActive.value]
    router.push({
      path: '/monitor/resource/' + mainTab.value,
      query: tab?.subType ? { sub: tab.subType } : {},
    })
  }
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
  recordVisit(app)
  rdpOpen(app)
}

const openRecent = (r) => {
  const found = allResourceItems.find(item => item.id === r.id)
  if (found) {
    recordVisit(found)
    rdpOpen(found)
  } else {
    rdpOpen(r)
  }
}

const toggleFocusById = (r) => {
  const found = allResourceItems.find(item => item.id === r.id)
  toggleFocus(found || r)
}

const relativeTime = (ts) => {
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return Math.floor(diff / 60000) + ' 分钟前'
  if (diff < 24 * 3600 * 1000) return Math.floor(diff / 3600000) + ' 小时前'
  return Math.floor(diff / 86400000) + ' 天前'
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

const dataSource = reactive({
  app: appData,
  cloud: cloudServiceData,
  cloudRes: cloudResData,
  virtual: virtualData,
  physical: physicalData,
})

const cardGroups = [
  { key: 'app', label: '业务应用', icon: 'fa-solid fa-circle-nodes', items: dataSource.app },
  { key: 'cloud', label: '云服务', icon: 'fa-solid fa-cloud', items: dataSource.cloud },
  { key: 'cloud-resource', label: '云资源', icon: 'fa-solid fa-server', items: dataSource.cloudRes },
  { key: 'virtual', label: '虚拟资源池', icon: 'fa-solid fa-layer-group', items: dataSource.virtual },
  { key: 'physical', label: '物理资源', icon: 'fa-solid fa-microchip', items: dataSource.physical },
]

const allResourceItems = computed(() => [
  ...dataSource.app, ...dataSource.cloud, ...dataSource.cloudRes, ...dataSource.virtual, ...dataSource.physical,
])

const matchesFilter = (item) => {
  if (filterState.modules.length && !filterState.modules.includes(item.type)) return false
  if (filterState.alerts.length && !filterState.alerts.includes(item.alertStatus)) return false
  if (filterState.runs.length && !filterState.runs.includes(item.runStatus)) return false
  if (filterState.scope === 'focused' && !isFocused(item.id)) return false
  if (filterState.scope === 'recent' && !filterState.recent.some(r => r.id === item.id)) return false
  return true
}

const filteredData = computed(() => {
  let base
  if (mainTab.value === 'all') base = [...dataSource.app, ...dataSource.cloud, ...dataSource.cloudRes, ...dataSource.virtual, ...dataSource.physical]
  else if (mainTab.value === 'app') base = dataSource.app
  else if (mainTab.value === 'cloud') base = dataSource.cloud
  else if (mainTab.value === 'cloud-resource') base = dataSource.cloudRes
  else if (mainTab.value === 'virtual') base = dataSource.virtual
  else if (mainTab.value === 'physical') base = dataSource.physical
  else base = dataSource.app
  base = base.filter(matchesFilter)
  if (currentSubType.value) {
    base = base.filter(item => (item.subType || item.appLevel) === currentSubType.value)
  }
  if (!searchText.value) return base
  const kw = searchText.value.toLowerCase()
  return base.filter(item =>
    item.name.toLowerCase().includes(kw) || (item.identifier || '').toLowerCase().includes(kw)
  )
})

const matchesSubType = (item, subType) => (item.subType || item.appLevel) === subType

const cardGroupsComputed = computed(() => {
  return cardGroups.map(g => {
    const subs = (subTabMap[g.key] || []).filter(s => s.subType)
    const subCards = subs.map(s => {
      const items = g.items.filter(item => matchesFilter(item) && matchesSubType(item, s.subType))
      const alertCount = items.filter(item => item.alertStatus === '紧急').length
      return { ...s, count: items.length, alertCount }
    })
    const total = subCards.reduce((sum, sc) => sum + sc.count, 0)
    const alertCount = subCards.reduce((sum, sc) => sum + sc.alertCount, 0)
    return { ...g, subCards, total, alertCount }
  })
})

const totalResourceCount = computed(() => allResourceItems.value.length)

const groupCount = (key) => {
  const g = cardGroups.find(x => x.key === key)
  return g ? g.items.length : 0
}

const alertStatusOptions = [
  { value: '紧急', label: '紧急', icon: 'fa-solid fa-circle-exclamation', color: '#f5222d' },
  { value: '正常', label: '正常', icon: 'fa-solid fa-circle-check', color: '#52c41a' },
]
const runStatusOptions = [
  { value: '运行中', label: '运行中', icon: 'fa-solid fa-play', color: '#52c41a' },
  { value: '已停止', label: '已停止', icon: 'fa-solid fa-stop', color: '#8c8c8c' },
]
const alertStatusCount = (val) => allResourceItems.value.filter(i => i.alertStatus === val).length
const runStatusCount = (val) => allResourceItems.value.filter(i => i.runStatus === val).length

const recentColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '模块', dataIndex: 'groupLabel', key: 'groupLabel', width: 140 },
  { title: '告警状态', dataIndex: 'alertStatus', key: 'alertStatus', width: 120 },
  { title: '访问时间', dataIndex: 'timeText', key: 'timeText', width: 140 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 80 },
]

const recentRows = computed(() => filterState.recent.map(r => {
  const groupLabel = (cardGroups.find(g => g.key === r.groupKey) || {}).label || r.groupKey
  return { ...r, groupLabel, timeText: relativeTime(r.time) }
}))

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
      // merge API data into reactive app data source
      dataSource.app.splice(0, dataSource.app.length, ...apiData)
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
  margin-bottom: 16px;
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
.group-focus-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #bfbfbf;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.group-header:hover .group-focus-btn,
.card-group:hover .group-focus-btn {
  opacity: 1;
}
.group-focus-btn:hover {
  color: #f5a623;
  background: rgba(245, 166, 35, 0.1);
}
.group-focus-btn.active {
  opacity: 1;
  color: #f5a623;
}

.sub-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.sub-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.sub-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #1890ff;
}
.sub-card-icon {
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
.sub-card-icon.alert {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}
.sub-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sub-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-card-alert {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-card-total {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  flex-shrink: 0;
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

.monitor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.filter-panel {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow-y: auto;
  min-height: 0;
}
.filter-panel.collapsed {
  width: 40px;
  overflow: visible;
}
.filter-expand-btn {
  position: sticky;
  top: 12px;
  width: 24px;
  height: 24px;
  margin: 12px auto 0;
  border: none;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.filter-expand-btn:hover {
  color: #1890ff;
  background: #e6f4ff;
}
.filter-panel-inner {
  padding: 16px 14px 20px;
}
.filter-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.filter-panel-head-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.filter-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.filter-collapse-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.filter-collapse-btn:hover {
  color: #1890ff;
  background: #e6f4ff;
}
.filter-section {
  margin-top: 14px;
}
.filter-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  margin-bottom: 8px;
}
.filter-scope-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-scope-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: #595959;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.filter-scope-item:hover {
  background: #f5f7fa;
}
.filter-scope-item.active {
  background: #e6f4ff;
  border-color: #91caff;
  color: #1890ff;
}
.filter-scope-item i {
  width: 16px;
  text-align: center;
  font-size: 13px;
}
.filter-scope-item span:not(.filter-scope-count) {
  flex: 1;
  font-size: 13px;
}
.filter-scope-count {
  font-size: 12px;
  color: #8c8c8c;
}
.filter-check-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #595959;
  transition: background 0.15s;
}
.filter-check-item:hover {
  background: #f5f7fa;
}
.filter-check-item.active {
  color: #1890ff;
}
.filter-check-box {
  width: 16px;
  height: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10px;
  color: transparent;
  transition: all 0.15s;
}
.filter-check-item.active .filter-check-box {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.filter-check-icon {
  width: 14px;
  text-align: center;
  font-size: 12px;
  color: #8c8c8c;
  flex-shrink: 0;
}
.filter-check-item.active .filter-check-icon {
  color: #1890ff;
}
.filter-check-label {
  flex: 1;
  font-size: 13px;
}
.filter-check-count {
  font-size: 12px;
  color: #8c8c8c;
}

.recent-bar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.recent-bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.recent-bar-title {
  font-size: 13px;
  font-weight: 600;
  color: #595959;
}
.recent-bar-title i {
  margin-right: 6px;
  color: #1890ff;
}
.recent-clear {
  font-size: 12px;
  color: #8c8c8c;
}
.recent-clear:hover {
  color: #f5222d;
}
.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  color: #595959;
  transition: all 0.15s;
}
.recent-item:hover {
  border-color: #91caff;
  color: #1890ff;
  background: #f0f7ff;
}
.recent-dot-alert {
  font-size: 8px;
  color: #f5222d;
}
.recent-dot-ok {
  font-size: 8px;
  color: #52c41a;
}
.recent-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-time {
  color: #bfbfbf;
  white-space: nowrap;
}
.recent-star {
  color: #d9d9d9;
  cursor: pointer;
  transition: color 0.15s;
}
.recent-star.active {
  color: #faad14;
}

.recent-view-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.recent-view-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.filter-empty {
  padding: 60px 0;
  text-align: center;
  color: #8c8c8c;
}
.filter-empty i {
  font-size: 40px;
  color: #d9d9d9;
  margin-bottom: 12px;
}
.filter-empty p {
  margin: 0 0 12px;
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
  min-width: 0;
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

.row-focus {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  cursor: pointer;
}
.row-focus i.off {
  color: #d9d9d9;
  font-size: 13px;
}
.row-focus i.on {
  color: #faad14;
  font-size: 13px;
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
}
</style>
