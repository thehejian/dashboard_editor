<template>
  <div class="page-view">
    <a-tabs v-model:activeKey="activeTab" class="page-tabs">
      <a-tab-pane key="current" tab="当前告警">
        <div class="current-alerts">
          <div class="toolbar-row">
            <a-select v-model:value="templateValue" placeholder="选择模板" style="width:320px" allowClear>
              <a-select-option value="default">默认模板</a-select-option>
              <a-select-option value="critical">仅紧急告警</a-select-option>
              <a-select-option value="warning">重要告警</a-select-option>
            </a-select>
            <a-input-search v-model:value="searchText" placeholder="搜索告警名称、资源" class="search-input" />
            <a-button class="mute-btn"><i class="fa-solid fa-volume-off"></i></a-button>
            <a-select v-model:value="refreshInterval" style="width:130px">
              <a-select-option :value="30">30秒刷新</a-select-option>
              <a-select-option :value="60">60秒刷新</a-select-option>
              <a-select-option :value="0">不刷新</a-select-option>
            </a-select>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-card-title">级别统计</div>
              <div ref="donutContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">告警状态</div>
              <div ref="barContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">告警持续时长</div>
              <div ref="durationContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">TOP N 告警</div>
              <div ref="topnContainer" class="chart-container"></div>
            </div>
          </div>

          <a-table
            :columns="columns"
            :data-source="filteredAlerts"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            :row-selection="{ selectedRowKeys: selectedKeys, onChange: function(keys) { selectedKeys = keys } }"
            row-key="id"
            :row-class-name="function(record) { return 'row-' + record.level }"
            :scroll="{ x: 1400, y: scrollY }"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
              </template>
              <template v-if="column.key === 'title'">
                <a class="alert-link" @click="openDetail(record)">{{ record.title }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'firing' ? 'red' : record.status === 'resolved' ? 'green' : 'default'">
                  {{ record.status === 'firing' ? '告警中' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-btns">
                  <a-tooltip title="查看详情">
                    <button class="icon-btn" @click="openDetail(record)"><i class="fa-solid fa-eye"></i></button>
                  </a-tooltip>
                  <a-tooltip title="处理告警">
                    <button class="icon-btn" @click="handleAlert(record.id)"><i class="fa-solid fa-check"></i></button>
                  </a-tooltip>
                </div>
              </template>
            </template>
          </a-table>


        </div>
      </a-tab-pane>

      <a-tab-pane key="history" tab="历史告警">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-range-picker v-model:value="historyTimeRange" style="width:260px" />
            <a-input-search v-model:value="historySearch" placeholder="搜索告警名称、资源" style="width:280px" />
            <a-select v-model:value="historyLevel" placeholder="告警级别" style="width:120px" allowClear>
              <a-select-option value="critical">紧急</a-select-option>
              <a-select-option value="warning">重要</a-select-option>
              <a-select-option value="info">次要</a-select-option>
            </a-select>
          </div>
          <a-table
            :columns="historyColumns"
            :data-source="historyFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 900 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
              <template v-if="column.key === 'status'"><a-tag :color="record.status === 'resolved' ? 'green' : 'default'">{{ record.status === 'resolved' ? '已恢复' : '处理中' }}</a-tag></template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="suppressed" tab="被屏蔽的告警">
        <div class="tab-empty">
          <i class="fa-solid fa-ban"></i>
          <p>暂无被屏蔽的告警</p>
        </div>
      </a-tab-pane>

      <a-tab-pane key="logs" tab="告警日志">
        <div class="tab-empty">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <p>告警日志功能开发中</p>
        </div>
      </a-tab-pane>

      <a-tab-pane key="experience" tab="维护经验">
        <div class="tab-empty">
          <i class="fa-solid fa-book"></i>
          <p>暂无维护经验记录</p>
        </div>
      </a-tab-pane>
    </a-tabs>

    <div class="detail-panel" :class="{ open: detailVisible }">
      <div class="detail-mask" @click="detailVisible = false"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ currentAlert ? currentAlert.title : '告警详情' }}</h3>
          <button class="close-btn" @click="detailVisible = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="detail-body" v-if="currentAlert">
          <a-tabs v-model:activeKey="activeDetailTab" class="detail-tabs-comp">
            <a-tab-pane key="info" tab="告警详情和处理建议">
              <div class="tab-panel">
                <div class="detail-kpi">
                  <div class="kpi-item">
                    <div class="kpi-label">告警级别</div>
                    <div class="kpi-value"><a-tag :color="getLevelColor(currentAlert.level)">{{ getLevelText(currentAlert.level) }}</a-tag></div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">告警状态</div>
                    <div class="kpi-value">
                      <a-tag :color="currentAlert.status === 'firing' ? 'red' : 'green'">
                        {{ currentAlert.status === 'firing' ? '告警中' : '已恢复' }}
                      </a-tag>
                    </div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">当前值</div>
                    <div class="kpi-value">{{ currentAlert.currentValue }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">阈值</div>
                    <div class="kpi-value">{{ currentAlert.threshold }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">持续时间</div>
                    <div class="kpi-value">{{ currentAlert.duration }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">触发时间</div>
                    <div class="kpi-value">{{ currentAlert.triggerTime }}</div>
                  </div>
                </div>
                <div class="section-block">
                  <div class="section-title">告警源</div>
                  <div class="section-body">{{ currentAlert.resource }}</div>
                </div>
                <div class="section-block">
                  <div class="section-title">处理建议</div>
                  <div class="section-body suggestion">{{ currentAlert.suggestion }}</div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="experience" tab="维护经验">
              <div class="tab-panel">
                <div class="tab-empty">
                  <i class="fa-solid fa-book"></i>
                  <p>暂无维护经验记录</p>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="history" tab="最近2个月处理记录">
              <div class="tab-panel">
                <a-table
                  :columns="historyRecordColumns"
                  :data-source="alertHistoryRecords"
                  :pagination="{ pageSize: 5, size: 'small' }"
                  row-key="id"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'level'">
                      <a-tag :color="getLevelColor(record.level)" size="small">{{ getLevelText(record.level) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'status'">
                      <a-tag :color="record.status === 'resolved' ? 'green' : 'default'" size="small">
                        {{ record.status === 'resolved' ? '已恢复' : '处理中' }}
                      </a-tag>
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
            <a-tab-pane key="help" tab="告警处理与告警帮助">
              <div class="tab-panel">
                <div class="help-section">
                  <h4><i class="fa-solid fa-headset"></i> 告警处理流程</h4>
                  <ol class="help-steps">
                    <li>确认告警级别与影响范围</li>
                    <li>检查相关资源状态与日志</li>
                    <li>执行对应处理建议</li>
                    <li>验证告警是否恢复</li>
                    <li>记录处理过程与结果</li>
                  </ol>
                </div>
                <div class="help-section">
                  <h4><i class="fa-solid fa-phone"></i> 联系方式</h4>
                  <div class="help-info">
                    <p>运维值班：138-0000-0001</p>
                    <p>DBA值班：138-0000-0002</p>
                    <p>网络值班：138-0000-0003</p>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Chart } from '@antv/g2'

const activeTab = ref('current')
const searchText = ref('')
const selectedKeys = ref([])
const refreshInterval = ref(30)
const templateValue = ref(null)
const detailVisible = ref(false)
const currentAlert = ref(null)
const activeDetailTab = ref('info')
const scrollY = ref(500)

const historySearch = ref('')
const historyLevel = ref(null)
const historyTimeRange = ref(null)

const realtimeAlerts = ref([])
const historyData = ref([])
const alertHistoryRecords = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/alerts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      realtimeAlerts.value = json.data.map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          metric: item.metric,
          currentValue: item.current_value,
          threshold: item.threshold,
          duration: item.duration,
          displayDuration: item.display_duration,
          durationMinutes: item.duration_minutes,
          triggerTime: item.trigger_time,
          recoveryTime: item.recovery_time || '-',
          status: item.status,
          suggestion: item.suggestion,
        }
      })
      historyData.value = json.data.filter(function(i) { return i.status === 'resolved' }).map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          time: item.trigger_time,
          duration: item.duration,
          status: item.status,
        }
      })
      alertHistoryRecords.value = json.data.filter(function(i) { return i.status === 'resolved' }).slice(0, 4).map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          time: item.trigger_time,
          duration: item.duration,
          status: item.status,
          operator: item.operator || '系统',
        }
      })
    }
  } catch (e) {
    console.error('加载告警数据失败:', e)
  } finally {
    loading.value = false
  }
  renderDonutChart()
  renderBarChart()
  renderDurationChart()
  renderTopNChart()
})

const columns = [
  { title: '告警级别', dataIndex: 'level', key: 'level', width: 100, sorter: function(a, b) { var order = { critical: 0, warning: 1, info: 2 }; return order[a.level] - order[b.level]; } },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 200 },
  { title: '告警指标', dataIndex: 'metric', key: 'metric', ellipsis: true, width: 120 },
  { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 100 },
  { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 110 },
  { title: '告警状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 110 },
  { title: '触发时间', dataIndex: 'triggerTime', key: 'triggerTime', width: 180 },
  { title: '恢复时间', dataIndex: 'recoveryTime', key: 'recoveryTime', width: 180 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' },
]

const historyColumns = [
  { title: '告警标题', dataIndex: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', ellipsis: true },
  { title: '级别', key: 'level', width: 80 },
  { title: '触发时间', dataIndex: 'time', width: 170 },
  { title: '持续时间', dataIndex: 'duration', width: 100 },
  { title: '状态', key: 'status', width: 90 },
]

const historyRecordColumns = [
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '处理人', dataIndex: 'operator', key: 'operator', width: 70 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
]

const firingAlerts = computed(function() {
  return realtimeAlerts.value.filter(function(a) { return a.status === 'firing' })
})

const filteredAlerts = computed(function() {
  var list = realtimeAlerts.value
  if (searchText.value) {
    var sk = searchText.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(sk) || a.resource.toLowerCase().includes(sk) })
  }
  return list
})

const historyFilteredData = computed(function() {
  var list = historyData.value
  if (historySearch.value) {
    var kw = historySearch.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) || a.resource.toLowerCase().includes(kw) })
  }
  if (historyLevel.value) {
    list = list.filter(function(a) { return a.level === historyLevel.value })
  }
  return list
})

const getLevelColor = function(level) {
  var map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}

const getLevelText = function(level) {
  var map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}

const handleAlert = function(id) {
  realtimeAlerts.value = realtimeAlerts.value.filter(function(a) { return a.id !== id })
}

const openDetail = function(alert) {
  currentAlert.value = alert
  activeDetailTab.value = 'info'
  detailVisible.value = true
}

// ---- G2 Charts ----
const donutContainer = ref(null)
const barContainer = ref(null)
const durationContainer = ref(null)
const topnContainer = ref(null)

let donutChart = null
let barChart = null
let durationChart = null
let topnChart = null

function renderDonutChart() {
  if (donutChart) { donutChart.destroy(); donutChart = null }
  if (!donutContainer.value) return

  var firing = firingAlerts.value
  var total = firing.length || 1
  var levels = ['critical', 'warning', 'info']
  var labels = { critical: '紧急', warning: '重要', info: '次要' }
  var colors = { critical: '#F5222D', warning: '#FA8C16', info: '#1890FF' }
  var data = levels.map(function(l) {
    return { name: labels[l], value: firing.filter(function(a) { return a.level === l }).length }
  })

  donutChart = new Chart({ container: donutContainer.value, autoFit: true, height: 160, padding: [10, 5, 10, 5] })
  donutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  donutChart.data(data)

  donutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: [colors.critical, colors.warning, colors.info] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '数量' }] })

  donutChart.label({ text: function(d) { return d.name + '\n' + d.value }, position: 'outside', connector: true, fontSize: 11, connectorStroke: '#ccc' })
  donutChart.legend('color', { position: 'right', layout: { justifyContent: 'center' }, itemSpacing: 8, itemLabelFontSize: 11 })
  donutChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  donutChart.render()
}

function renderBarChart() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (!barContainer.value) return

  var list = realtimeAlerts.value
  var data = [
    { status: '告警中', value: list.filter(function(a) { return a.status === 'firing' }).length },
    { status: '已恢复', value: list.filter(function(a) { return a.status === 'resolved' }).length },
    { status: '已屏蔽', value: list.filter(function(a) { return a.status === 'suppressed' }).length },
  ]

  barChart = new Chart({ container: barContainer.value, autoFit: true, height: 160, padding: [10, 20, 24, 20] })
  barChart.data(data)

  barChart.interval()
    .encode('x', 'status')
    .encode('y', 'value')
    .encode('color', 'status')
    .scale('color', { range: ['#F5222D', '#52C41A', '#BFBFBF'] })
    .style('radius', 4)
    .tooltip({ title: 'status', items: [{ channel: 'y', name: '数量' }] })

  barChart.label({ text: 'value', position: 'top', fontSize: 11, fontWeight: 'bold' })
  barChart.axis('x', { title: null, labelFontSize: 11 })
  barChart.axis('y', { title: null, labelFontSize: 10 })
  barChart.legend(false)
  barChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  barChart.render()
}

function renderDurationChart() {
  if (durationChart) { durationChart.destroy(); durationChart = null }
  if (!durationContainer.value) return

  var data = firingAlerts.value
    .filter(function(a) { return a.status === 'firing' })
    .sort(function(a, b) { return b.durationMinutes - a.durationMinutes })
    .slice(0, 4)
    .map(function(a) {
      return { name: a.title.length > 8 ? a.title.slice(0, 8) + '..' : a.title, duration: a.durationMinutes }
    })

  durationChart = new Chart({ container: durationContainer.value, autoFit: true, height: 160, padding: [10, 40, 20, 80] })
  durationChart.data(data)

  durationChart.interval()
    .encode('x', 'duration')
    .encode('y', 'name')
    .encode('color', 'name')
    .scale('color', { range: ['#007DFF', '#40A9FF', '#69C0FF', '#91D5FF'] })
    .style('radius', 3)
    .tooltip({ title: 'name', items: [{ channel: 'x', name: '持续(分钟)' }] })

  durationChart.label({ text: 'duration', position: 'right', fontSize: 10, fontWeight: 'bold' })
  durationChart.axis('y', { title: null, labelFontSize: 11 })
  durationChart.axis('x', { title: null, labelFontSize: 10 })
  durationChart.legend(false)
  durationChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  durationChart.render()
}

function renderTopnChart() {
  if (topnChart) { topnChart.destroy(); topnChart = null }
  if (!topnContainer.value) return

  var groups = {}
  realtimeAlerts.value.forEach(function(a) {
    var key = a.metric
    groups[key] = (groups[key] || 0) + 1
  })
  var data = Object.entries(groups)
    .sort(function(a, b) { return b[1] - a[1] })
    .slice(0, 5)
    .map(function(item) { return { name: item[0].length > 6 ? item[0].slice(0, 6) + '..' : item[0], count: item[1] } })

  topnChart = new Chart({ container: topnContainer.value, autoFit: true, height: 160, padding: [10, 20, 24, 20] })
  topnChart.data(data)

  topnChart.interval()
    .encode('x', 'name')
    .encode('y', 'count')
    .encode('color', 'name')
    .scale('color', { range: ['#007DFF', '#40A9FF', '#69C0FF', '#91D5FF', '#BAE7FF'] })
    .style('radius', 4)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '次数' }] })

  topnChart.label({ text: 'count', position: 'top', fontSize: 11, fontWeight: 'bold' })
  topnChart.axis('x', { title: null, labelFontSize: 10, labelAutoRotate: false })
  topnChart.axis('y', { title: null, labelFontSize: 10 })
  topnChart.legend(false)
  topnChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  topnChart.render()
}

function renderCharts() {
  renderDonutChart()
  renderBarChart()
  renderDurationChart()
  renderTopnChart()
}

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})

onBeforeUnmount(function() {
  window.removeEventListener('resize', updateScrollY)
  if (donutChart) donutChart.destroy()
  if (barChart) barChart.destroy()
  if (durationChart) durationChart.destroy()
  if (topnChart) topnChart.destroy()
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; height: 100%; }
.page-view :deep(.ant-tabs) { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.page-view :deep(.ant-tabs-nav) { margin: 4px 0 16px 0 !important; }
.page-view :deep(.ant-tabs-content-holder) { flex: 1; min-height: 0; overflow: auto; padding: 0; }
.page-view :deep(.ant-tabs-content) { height: 100%; }
.page-view :deep(.ant-tabs-tabpane) { height: 100%; }

.current-alerts { display: flex; flex-direction: column; height: 100%; }

.toolbar-row { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.search-input { flex: 1; min-width: 200px; }
.mute-btn { width: 32px; display: flex; align-items: center; justify-content: center; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-card { background: #fff; border-radius: 8px; padding: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
.stat-card-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; flex-shrink: 0; }
.chart-container { flex: 1; min-height: 0; }

:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
:deep(.ant-table-row) { cursor: pointer; }
:deep(.ant-table-row:hover td) { background: #e6f7ff !important; }
:deep(.row-critical) { background: #fff1f0; }
:deep(.row-warning) { background: #fff7e6; }
:deep(.row-critical:hover td) { background: #fff1f0 !important; }
:deep(.row-warning:hover td) { background: #fff7e6 !important; }

.alert-link { color: var(--brand); cursor: pointer; }
.alert-link:hover { text-decoration: underline; }

.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }

.history-alerts { display: flex; flex-direction: column; height: 100%; }
.history-alerts .filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; }
.history-alerts :deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.history-alerts :deep(.ant-table) { flex: 1; min-height: 0; }
.history-alerts :deep(.ant-table-container) { flex: 1; min-height: 0; }

.tab-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #8c8c8c; }
.tab-empty i { font-size: 48px; margin-bottom: 16px; }
.tab-empty p { margin: 0; font-size: 14px; }

.detail-panel {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.detail-panel.open { pointer-events: auto; opacity: 1; }
.detail-mask { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0, 0, 0, 0.3); }
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -560px;
  width: 560px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
}
.detail-panel.open .detail-panel-content { right: 0; }
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.close-btn { font-size: 16px; color: #8c8c8c; border: none; background: transparent; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: var(--brand); background: var(--bg-sec); }
.detail-body { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.detail-body :deep(.ant-tabs > .ant-tabs-nav) { margin-bottom: 16px; }
.tab-panel { min-height: 200px; }
.detail-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-item { padding: 12px; background: #fafafa; border-radius: 6px; }
.kpi-label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.kpi-value { font-size: 14px; font-weight: 500; }
.section-block { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.section-body { font-size: 13px; color: #595959; line-height: 1.8; white-space: pre-line; }
.section-body.suggestion { background: #f6ffed; padding: 12px; border-radius: 6px; border-left: 3px solid #52c41a; }
.help-section { margin-bottom: 20px; }
.help-section h4 { font-size: 14px; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.help-steps { margin: 0; padding-left: 20px; font-size: 13px; line-height: 2; }
.help-info { font-size: 13px; line-height: 1.8; }
.help-info p { margin: 4px 0; }

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .toolbar-row { flex-direction: column; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
  .detail-kpi { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
