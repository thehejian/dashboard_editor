import { reactive, computed, watch } from 'vue'

const METRICS_NEW = ['CPU使用率','内存使用率','网络流入速率','网络流出速率','云硬盘使用率','云硬盘I/O写入']

const CASCADE = {
  group: [
    { name: '全部', items: [
      { name: '宿主机性能分析 (多云)',   metrics: METRICS_NEW },
      { name: '弹性云服务器性能分析 (多云)', metrics: METRICS_NEW },
      { name: '云硬盘性能分析 (多云)',    metrics: METRICS_NEW },
    ]},
    { name: '资源性能分析', items: [{ name: '弹性云服务器', metrics: METRICS_NEW }]},
    { name: '容量分析',          items: [] },
    { name: '资源统计',          items: [] },
    { name: '系统级监控',        items: [] },
    { name: '业务分析',          items: [] },
    { name: 'AI云服务可用性状态', items: [] },
  ],
  resource: [
    { name: '全部', items: [
      { name: '宿主机性能分析 (多云)',   metrics: METRICS_NEW },
      { name: '弹性云服务器性能分析 (多云)', metrics: METRICS_NEW },
      { name: '云硬盘性能分析 (多云)',    metrics: METRICS_NEW },
    ]},
    { name: '业务应用',    items: [] },
    { name: '云服务',      items: [] },
    { name: '云资源',      items: [] },
    { name: '虚拟资源池',  items: [] },
    { name: '物理资源',    items: [] },
  ],
}

const ALL_RESOURCES = ['host-01.cloud','host-02.cloud','ecs-web-01','ecs-web-02','ecs-app-01','ecs-app-02','evs-data-01','evs-data-02','evs-backup-01','evs-backup-02']

const TH_COLORS = [
  { key:'danger',  label:'紧急', color:'#F5222D' },
  { key:'warning', label:'重要', color:'#FF7D00' },
  { key:'minor',   label:'次要', color:'#FADB14' },
  { key:'info',    label:'提示', color:'#007DFF' },
]

const GROUPS = ['默认分组','计算资源','存储资源','网络资源','宿主机','弹性云服务器','云硬盘']

const CHART_DEFS = [
  { i:'fa-solid fa-hashtag',    l:'数值图', t:'numeric' },
  { i:'fa-solid fa-chart-line', l:'折线图', t:'line' },
  { i:'fa-solid fa-chart-area', l:'面积图', t:'area' },
  { i:'fa-solid fa-chart-bar',  l:'柱状图', t:'bar' },
]

const METRIC_REC = {
  'CPU使用率':['line','area'],
  '内存使用率':['area','line'],
  '网络流入速率':['area','line'],
  '网络流出速率':['line','area'],
  '云硬盘使用率':['area','numeric'],
  '云硬盘I/O写入':['bar','line'],
}

const CHARTS_DATA = [
  { id:1, title:'CPU 使用率',      type:'line',    color:'#007DFF', group:'计算资源',   notes:'', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'' },
  { id:2, title:'内存使用率',       type:'area',    color:'#07C160', group:'计算资源',   notes:'', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'' },
  { id:3, title:'网络流入速率',     type:'area',    color:'#06B6D4', group:'网络资源',   notes:'', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'' },
  { id:4, title:'网络流出速率',     type:'line',    color:'#FF7D00', group:'网络资源',   notes:'', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'' },
  { id:5, title:'云硬盘使用率',     type:'numeric', color:'#007DFF', group:'存储资源',   notes:'', legendPosition:'bottom', thresholds:[], linkEnabled:true,  linkUrl:'https://example.com/dashboard/5' },
  { id:6, title:'云硬盘 I/O 写入',  type:'bar',     color:'#F5222D', group:'默认分组',   notes:'', legendPosition:'bottom', thresholds:[{value:80,level:'warning'},{value:95,level:'danger'}], linkEnabled:false, linkUrl:'' },
]

function cloneCharts() {
  return JSON.parse(JSON.stringify(CHARTS_DATA)).map(ch => ({ ...ch, thresholds: [...ch.thresholds] }))
}

const state = reactive({
  charts: cloneCharts(),
  selectedId: null,
  configTab: 'data',
  configOpen: false,
  nextId: 7,
  selectedMetrics: [],
  selectedResources: [],
  dsType: 'group',
  dsIndex: 0,
  dsSubIndex: 0,
  objType: 'all',
  aggType: 'max',
  topN: 10,
  period: '24h',
  interval: '1m',
  toast: null,
})


const currentChart = computed(() => state.charts.find(ch => ch.id === state.selectedId) || null)

const currentCategory = computed(() => CASCADE[state.dsType]?.[state.dsIndex] || null)

const currentSubDataset = computed(() => {
  const cat = currentCategory.value
  if (!cat || !cat.items?.length) return null
  return cat.items[state.dsSubIndex] || null
})

const availableMetrics = computed(() => currentSubDataset.value?.metrics || [])

const recommendedCharts = computed(() => {
  if (!state.selectedMetrics.length) return { items: [], label: '' }
  const isNow = state.period === 'now'
  let types
  if (isNow) {
    types = ['numeric', 'line', 'area']
  } else {
    const first = state.selectedMetrics[0]
    types = METRIC_REC[first] || ['line', 'area', 'bar', 'numeric']
  }
  const cur = currentChart.value?.type || 'line'
  const sorted = [...CHART_DEFS].sort((a, b) => {
    const ia = types.indexOf(a.t)
    const ib = types.indexOf(b.t)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return { items: sorted, types, cur, mode: isNow ? 'current' : 'trend' }
})

function toast(msg, duration = 2000) {
  state.toast = msg
  setTimeout(() => { if (state.toast === msg) state.toast = null }, duration)
}

function addChart(type) {
  const colors = ['#007DFF','#07C160','#FF7D00','#06B6D4','#F5222D']
  const ch = {
    id: state.nextId++,
    title: `图表 ${state.nextId - 1}`,
    type: type || 'line',
    color: colors[(state.nextId - 1) % colors.length],
    group: '默认分组',
    notes: '',
    legendPosition: 'bottom',
    thresholds: [],
    linkEnabled: false,
    linkUrl: '',
  }
  state.charts.push(ch)
  selectChart(ch.id)
  toast('已添加图表')
}

function delChart(id) {
  const idx = state.charts.findIndex(ch => ch.id === id)
  if (idx === -1) return
  state.charts.splice(idx, 1)
  if (state.selectedId === id) closeConfig()
  toast('已删除图表')
}

function dupChart(id) {
  const ch = state.charts.find(c => c.id === id)
  if (!ch) return
  const copy = { ...ch, id: state.nextId++, title: ch.title + ' (副本)', thresholds: [...ch.thresholds] }
  state.charts.push(copy)
  toast('已复制图表')
}

function selectChart(id) {
  state.selectedId = id
  state.configOpen = true
  switchTab('data')
}

function closeConfig() {
  state.configOpen = false
  state.selectedId = null
}

function switchTab(tab) {
  state.configTab = tab
}

function switchDSType(val) {
  state.dsType = val
  state.dsIndex = 0
  state.dsSubIndex = 0
  state.selectedMetrics = []
}

function onCategoryChange() {
  state.dsSubIndex = 0
  state.selectedMetrics = []
}

function onSubDatasetChange() {
  state.selectedMetrics = []
}

function toggleMetric(name) {
  const idx = state.selectedMetrics.indexOf(name)
  if (idx === -1) state.selectedMetrics.push(name)
  else state.selectedMetrics.splice(idx, 1)
}

function removeMetric(name) {
  const idx = state.selectedMetrics.indexOf(name)
  if (idx !== -1) state.selectedMetrics.splice(idx, 1)
}

function toggleResource(name) {
  const idx = state.selectedResources.indexOf(name)
  if (idx === -1) state.selectedResources.push(name)
  else state.selectedResources.splice(idx, 1)
}

function removeResource(name) {
  const idx = state.selectedResources.indexOf(name)
  if (idx !== -1) state.selectedResources.splice(idx, 1)
}

function setObjType(val) {
  state.objType = val
}

function spinTop(delta) {
  state.topN = Math.max(1, Math.min(100, state.topN + delta))
}

function pickRec(type) {
  const ch = currentChart.value
  if (ch) ch.type = type
}

function addThreshold() {
  const ch = currentChart.value
  if (!ch) return
  ch.thresholds.push({ value: '', level: 'warning' })
}

function removeThreshold(idx) {
  const ch = currentChart.value
  if (!ch) return
  ch.thresholds.splice(idx, 1)
}

function updateThValue(idx, val) {
  const ch = currentChart.value
  if (!ch) return
  if (!ch.thresholds[idx]) ch.thresholds[idx] = { value: '', level: 'warning' }
  ch.thresholds[idx].value = val
}

function updateThLevel(idx, level) {
  const ch = currentChart.value
  if (!ch) return
  if (!ch.thresholds[idx]) ch.thresholds[idx] = { value: '', level: 'warning' }
  ch.thresholds[idx].level = level
}

function toggleLink() {
  const ch = currentChart.value
  if (!ch) return
  ch.linkEnabled = !ch.linkEnabled
}

function getCurrentThresholds() {
  return currentChart.value?.thresholds || []
}

export function useEditorState() {
  return {
    // data
    CASCADE, ALL_RESOURCES, TH_COLORS, GROUPS, CHART_DEFS,
    // state
    state,
    // computed
    currentChart, currentCategory, currentSubDataset, availableMetrics, recommendedCharts,
    // methods
    toast, addChart, delChart, dupChart,
    selectChart, closeConfig, switchTab,
    switchDSType, onCategoryChange, onSubDatasetChange,
    toggleMetric, removeMetric, toggleResource, removeResource,
    setObjType, spinTop, pickRec, addThreshold, removeThreshold,
    updateThValue, updateThLevel, toggleLink, getCurrentThresholds,
  }
}
