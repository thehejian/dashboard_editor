import { reactive, computed } from 'vue'
import { fetchChartData } from './usePrometheus'

const METRICS_NEW = ['CPU使用率','内存使用率','网络流入速率','网络流出速率','云硬盘使用率','云硬盘I/O写入']

const CASCADE = {
  group: [
    { name: '全部', items: [
      { name: '宿主机性能分析 (多云)',   metrics: METRICS_NEW },
      { name: '弹性云服务器性能分析 (多云)', metrics: METRICS_NEW },
      { name: '云硬盘性能分析 (多云)',    metrics: METRICS_NEW },
    ]},
    { name: '资源性能分析', items: [
      { name: '弹性云服务器 ECS', metrics: METRICS_NEW },
      { name: '裸金属服务器 BMS', metrics: METRICS_NEW },
      { name: 'GPU云服务器', metrics: METRICS_NEW },
    ]},
    { name: '容量分析', items: [
      { name: '云硬盘容量分析', metrics: ['云硬盘使用率', '云硬盘I/O写入', '云硬盘I/O读取'] },
      { name: '对象存储容量', metrics: ['存储使用量', '存储请求次数'] },
      { name: '文件存储容量', metrics: ['文件系统使用率', 'inode使用率'] },
    ]},
    { name: '资源统计', items: [
      { name: 'ECS资源统计', metrics: ['实例数', 'CPU总量', '内存总量'] },
      { name: 'VPC网络统计', metrics: ['带宽使用率', '流量统计'] },
      { name: '安全组统计', metrics: ['规则数', '关联实例数'] },
    ]},
    { name: '系统级监控', items: [
      { name: '宿主机监控', metrics: ['CPU使用率', '内存使用率', '磁盘使用率', '网络流入速率', '网络流出速率'] },
      { name: '虚拟化层监控', metrics: ['虚拟机数量', 'Hypervisor负载', '资源池利用率'] },
      { name: '基础设施监控', metrics: ['电源状态', '温度监控', 'UPS状态'] },
    ]},
    { name: '业务分析', items: [
      { name: '网站访问分析', metrics: ['访问量', '响应时间', '错误率'] },
      { name: 'API调用分析', metrics: ['调用次数', '延迟', '成功率'] },
      { name: '数据库性能', metrics: ['QPS', '连接数', '慢查询'] },
    ]},
    { name: 'AI云服务可用性状态', items: [
      { name: 'ModelArts服务', metrics: ['训练任务数', '推理请求数', 'GPU利用率'] },
      { name: 'AI应用实例', metrics: ['实例状态', '响应时间', '错误率'] },
    ]},
  ],
  resource: [
    { name: '全部', items: [
      { name: '宿主机性能分析 (多云)',   metrics: METRICS_NEW },
      { name: '弹性云服务器性能分析 (多云)', metrics: METRICS_NEW },
      { name: '云硬盘性能分析 (多云)',    metrics: METRICS_NEW },
    ]},
    { name: '业务应用', items: [
      { name: 'Web应用', metrics: ['请求数', '响应时间', '错误率'] },
      { name: '微服务', metrics: ['调用次数', '延迟', '成功率'] },
      { name: '后台服务', metrics: ['处理任务数', '队列长度', '资源使用率'] },
    ]},
    { name: '云服务', items: [
      { name: 'RDS数据库', metrics: ['QPS', '连接数', 'CPU使用率', '内存使用率'] },
      { name: 'Redis缓存', metrics: ['命中率', '内存使用', '连接数'] },
      { name: 'OBS对象存储', metrics: ['请求次数', '流量', '存储量'] },
    ]},
    { name: '云资源', items: [
      { name: '弹性云服务器ECS', metrics: METRICS_NEW },
      { name: '云硬盘EVS', metrics: ['使用率', 'I/O写入', 'I/O读取'] },
      { name: '弹性公网IP', metrics: ['带宽使用', '流量统计'] },
    ]},
    { name: '虚拟资源池', items: [
      { name: 'Kubernetes集群', metrics: ['节点数', 'Pod数', 'CPU使用率', '内存使用率'] },
      { name: '容器实例', metrics: ['实例数', 'CPU使用', '内存使用'] },
      { name: 'Serverless函数', metrics: ['调用次数', '执行时间', '并发数'] },
    ]},
    { name: '物理资源', items: [
      { name: '物理服务器', metrics: ['CPU使用率', '内存使用率', '磁盘使用率', '网络流量'] },
      { name: '网络设备', metrics: ['端口带宽', '包转发率', 'CPU使用率'] },
      { name: '存储设备', metrics: ['存储使用率', 'IOPS', '吞吐量'] },
    ]},
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
  { id:1, title:'CPU 使用率',      type:'numeric', color:'#007DFF', group:'核心指标', notes:'当前 CPU 使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['CPU使用率'] },
  { id:2, title:'内存使用率',       type:'numeric', color:'#07C160', group:'核心指标', notes:'当前内存使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['内存使用率'] },
  { id:3, title:'系统负载 (1分钟)', type:'numeric', color:'#FF7D00', group:'核心指标', notes:'1分钟平均负载 (超过CPU核心数需关注)', legendPosition:'bottom', thresholds:[{value:4,level:'warning'},{value:8,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['系统负载'] },
  { id:4, title:'系统运行时间',     type:'numeric', color:'#06B6D4', group:'核心指标', notes:'系统运行时长', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['运行时间'] },
  { id:5, title:'CPU 使用率趋势',   type:'line',    color:'#007DFF', group:'CPU监控', notes:'CPU 使用率随时间变化', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['CPU使用率'] },
  { id:6, title:'内存使用趋势',     type:'area',    color:'#07C160', group:'内存监控', notes:'内存使用量随时间变化', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['内存使用率'] },
  { id:7, title:'磁盘使用率',       type:'numeric', color:'#F5222D', group:'磁盘监控', notes:'磁盘空间使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['磁盘使用率'] },
  { id:8, title:'磁盘 I/O 速率',    type:'line',    color:'#9C27B0', group:'磁盘监控', notes:'磁盘读写速度 (MB/s)', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['磁盘读取'] },
  { id:9, title:'网络流量',         type:'area',    color:'#06B6D4', group:'网络监控', notes:'网络入/出流量 (MB/s)', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['网络流入速率'] },
  { id:10, title:'系统负载趋势',    type:'line',    color:'#FF7D00', group:'系统负载', notes:'1/5/15分钟负载', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['系统负载'] },
]

function cloneCharts() {
  return JSON.parse(JSON.stringify(CHARTS_DATA)).map(ch => ({ ...ch, thresholds: [...ch.thresholds], metrics: [...ch.metrics] }))
}

const REGIONS = [
  { id: 'cn-north-1', name: '华北区域一', code: 'cn-north-1' },
  { id: 'cn-north-2', name: '华北区域二', code: 'cn-north-2' },
  { id: 'cn-north-3', name: '华北区域三', code: 'cn-north-3' },
  { id: 'cn-south-1', name: '华南区域一', code: 'cn-south-1' },
  { id: 'cn-east-1', name: '华东区域一', code: 'cn-east-1' },
  { id: 'cn-east-2', name: '华东区域二', code: 'cn-east-2' },
  { id: 'us-east-1', name: '美东区域一', code: 'us-east-1' },
  { id: 'us-west-1', name: '美西区域一', code: 'us-west-1' },
  { id: 'ap-southeast-1', name: '新加坡区域', code: 'ap-southeast-1' },
  { id: 'ap-southeast-2', name: '曼谷区域', code: 'ap-southeast-2' },
]

function createDashboard(id, title, region = 'cn-north-1', period = '24h', charts = null, slug = '') {
  return {
    id,
    title,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dashboard-' + id,
    region,
    period,
    charts: charts || cloneCharts(),
  }
}

const CONTAINER_CHARTS = [
  { id:101, title:'集群节点数',      type:'numeric', color:'#007DFF', group:'集群概览', notes:'集群中节点总数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['集群节点数'] },
  { id:102, title:'Pod 总数',        type:'numeric', color:'#07C160', group:'集群概览', notes:'集群中 Pod 总数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod总数'] },
  { id:103, title:'运行中 Pod',      type:'numeric', color:'#07C160', group:'集群概览', notes:'Running 状态的 Pod', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['运行中Pod'] },
  { id:104, title:'异常 Pod',        type:'numeric', color:'#F5222D', group:'集群概览', notes:'非 Running 状态的 Pod', legendPosition:'bottom', thresholds:[{value:1,level:'warning'},{value:5,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['异常Pod'] },

  { id:105, title:'节点 CPU 使用率', type:'area',    color:'#007DFF', group:'节点资源', notes:'所有节点平均 CPU 使用率', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点CPU使用率'] },
  { id:106, title:'节点内存使用率',  type:'area',    color:'#07C160', group:'节点资源', notes:'所有节点平均内存使用率', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点内存使用率'] },
  { id:107, title:'节点磁盘使用率',  type:'numeric', color:'#F5222D', group:'节点资源', notes:'节点磁盘使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点磁盘使用率'] },
  { id:108, title:'节点网络流入',    type:'area',    color:'#06B6D4', group:'节点资源', notes:'所有节点网络入流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点网络流入'] },
  { id:109, title:'节点网络流出',    type:'area',    color:'#FF7D00', group:'节点资源', notes:'所有节点网络出流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点网络流出'] },
  { id:110, title:'节点负载',        type:'line',    color:'#9C27B0', group:'节点资源', notes:'节点负载趋势', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['节点负载'] },

  { id:111, title:'Pod 运行数',      type:'numeric', color:'#07C160', group:'Pod状态', notes:'Running 状态 Pod 数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod运行数'] },
  { id:112, title:'Pod 等待数',      type:'numeric', color:'#FF7D00', group:'Pod状态', notes:'Pending 状态 Pod 数', legendPosition:'bottom', thresholds:[{value:1,level:'warning'},{value:5,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod等待数'] },
  { id:113, title:'Pod 终止数',      type:'numeric', color:'#F5222D', group:'Pod状态', notes:'Failed/Terminated Pod 数', legendPosition:'bottom', thresholds:[{value:1,level:'warning'},{value:3,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod终止数'] },
  { id:114, title:'Pod 重启次数',    type:'numeric', color:'#FF7D00', group:'Pod状态', notes:'Pod 重启总次数', legendPosition:'bottom', thresholds:[{value:5,level:'warning'},{value:20,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod重启次数'] },
  { id:115, title:'OOMKill 次数',   type:'numeric', color:'#F5222D', group:'Pod状态', notes:'内存溢出被 kill 次数', legendPosition:'bottom', thresholds:[{value:1,level:'warning'},{value:5,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['OOMKill次数'] },
  { id:116, title:'CPU Throttling',  type:'numeric', color:'#FF7D00', group:'Pod状态', notes:'CPU 限流次数', legendPosition:'bottom', thresholds:[{value:10,level:'warning'},{value:50,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['CPUThrottling'] },

  { id:117, title:'容器 CPU 使用率', type:'area',    color:'#007DFF', group:'容器资源', notes:'容器 CPU 使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器CPU使用率'] },
  { id:118, title:'容器内存使用率',  type:'area',    color:'#07C160', group:'容器资源', notes:'容器内存使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器内存使用率'] },
  { id:119, title:'容器网络流入',    type:'area',    color:'#06B6D4', group:'容器资源', notes:'容器网络入流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器网络流入'] },
  { id:120, title:'容器网络流出',    type:'area',    color:'#FF7D00', group:'容器资源', notes:'容器网络出流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器网络流出'] },
  { id:121, title:'容器磁盘读取',    type:'area',    color:'#9C27B0', group:'容器资源', notes:'容器块设备读取', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器磁盘读取'] },
  { id:122, title:'容器磁盘写入',    type:'area',    color:'#E11D48', group:'容器资源', notes:'容器块设备写入', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['容器磁盘写入'] },

  { id:123, title:'Pod 网络流入速率',type:'area',    color:'#06B6D4', group:'网络流量', notes:'Pod 网络入流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod网络流入速率'] },
  { id:124, title:'Pod 网络流出速率',type:'area',    color:'#FF7D00', group:'网络流量', notes:'Pod 网络出流量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Pod网络流出速率'] },
  { id:125, title:'Service 入口流量',type:'line',    color:'#007DFF', group:'网络流量', notes:'Service 入口请求量', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Service入口流量'] },
  { id:126, title:'Ingress QPS',      type:'line',    color:'#07C160', group:'网络流量', notes:'Ingress 请求速率', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['IngressQPS'] },
  { id:127, title:'Ingress 延迟',     type:'line',    color:'#FF7D00', group:'网络流量', notes:'Ingress 请求延迟', legendPosition:'bottom', thresholds:[{value:500,level:'warning'},{value:2000,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Ingress延迟'] },
  { id:128, title:'Ingress 错误率',  type:'line',    color:'#F5222D', group:'网络流量', notes:'Ingress 5xx 错误率', legendPosition:'bottom', thresholds:[{value:1,level:'warning'},{value:5,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Ingress错误率'] },

  { id:129, title:'PVC 已用容量',     type:'numeric', color:'#007DFF', group:'存储卷', notes:'PVC 已使用存储', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['PVC已用容量'] },
  { id:130, title:'PVC 可用容量',     type:'numeric', color:'#07C160', group:'存储卷', notes:'PVC 可用存储', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['PVC可用容量'] },
  { id:131, title:'存储请求量',       type:'line',    color:'#06B6D4', group:'存储卷', notes:'存储资源请求趋势', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['存储请求量'] },
  { id:132, title:'存储利用率',       type:'area',    color:'#F5222D', group:'存储卷', notes:'存储使用百分比', legendPosition:'bottom', thresholds:[{value:70,level:'warning'},{value:90,level:'danger'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['存储利用率'] },

  { id:133, title:'Deployment 数量',type:'numeric', color:'#007DFF', group:'工作负载', notes:'Deployment 总数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['Deployment数量'] },
  { id:134, title:'StatefulSet 数量',type:'numeric', color:'#07C160', group:'工作负载', notes:'StatefulSet 总数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['StatefulSet数量'] },
  { id:135, title:'DaemonSet 数量',  type:'numeric', color:'#06B6D4', group:'工作负载', notes:'DaemonSet 总数', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['DaemonSet数量'] },
  { id:136, title:'滚动更新中',       type:'numeric', color:'#FF7D00', group:'工作负载', notes:'正在滚动更新的 workload', legendPosition:'bottom', thresholds:[{value:1,level:'warning'}], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['滚动更新中'] },
  { id:137, title:'就绪副本数',       type:'line',    color:'#07C160', group:'工作负载', notes:'就绪副本数趋势', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['就绪副本数'] },
  { id:138, title:'期望副本数',       type:'line',    color:'#9CA3AF', group:'工作负载', notes:'期望副本数趋势', legendPosition:'bottom', thresholds:[], linkEnabled:false, linkUrl:'', drillDownUrl:'', metrics:['期望副本数'] },
]

function cloneContainerCharts() {
  return JSON.parse(JSON.stringify(CONTAINER_CHARTS)).map(ch => ({ ...ch, thresholds: [...ch.thresholds], metrics: [...ch.metrics] }))
}

const DASHBOARDS = [
  createDashboard(1, '宿主机监控', 'cn-north-1', '24h', null, 'host'),
  createDashboard(6, '虚拟机监控', 'cn-north-1', '24h', null, 'vm'),
  createDashboard(7, 'NAS监控', 'cn-north-1', '24h', null, 'nas'),
  createDashboard(2, '容器监控', 'cn-north-1', '24h', cloneContainerCharts(), 'container'),
  createDashboard(3, '开发环境监控', 'cn-north-2', '6h', null, 'dev'),
  createDashboard(4, '测试环境仪表盘', 'cn-east-1', '24h', null, 'test'),
  createDashboard(5, 'OBS监控', 'cn-north-1', '24h', null, 'obs'),
]

function cloneDashboards() {
  return JSON.parse(JSON.stringify(DASHBOARDS)).map(d => ({
    ...d,
    charts: d.charts.map(ch => ({ ...ch, thresholds: [...ch.thresholds], metrics: [...ch.metrics] })),
  }))
}

const state = reactive({
  dashboards: cloneDashboards(),
  currentDashboardId: 1,
  editMode: false,
  currentRegion: 'cn-north-1',
  charts: cloneCharts(),
  selectedId: null,
  configTab: 'data',
  configOpen: false,
  nextId: 11,
  selectedMetrics: [],
  selectedResources: [],
  dsType: 'group',
  dsValue: [0, 0],
  objType: 'all',
  aggType: 'max',
  topN: 10,
  period: '24h',
  interval: '1m',
  toast: null,
  refreshInterval: null,
  refreshRate: '0',
  lastRefresh: null,
})

const REFRESH_OPTIONS = [
  { value: '0', label: '关闭' },
  { value: '30', label: '30秒' },
  { value: '60', label: '1分钟' },
  { value: '300', label: '5分钟' },
  { value: '900', label: '15分钟' },
  { value: '1800', label: '30分钟' },
]

const currentDashboard = computed(() => state.dashboards.find(d => d.id === state.currentDashboardId) || null)

const chartData = reactive({})

const currentChart = computed(() => state.charts.find(ch => ch.id === state.selectedId) || null)

const currentCategory = computed(() => CASCADE[state.dsType]?.[state.dsValue[0]] || null)

const currentSubDataset = computed(() => {
  const cat = currentCategory.value
  if (!cat || !cat.items?.length) return null
  return cat.items[state.dsValue[1] || 0] || null
})

const availableMetrics = computed(() => currentSubDataset.value?.metrics || [])

const recommendedCharts = computed(() => {
  if (!state.selectedMetrics.length) return { items: [], types: [], cur: '', mode: '', warning: '' }

  const isNow = state.period === 'now'
  const isSingleResource = state.objType === 'spec' && state.selectedResources.length === 1

  let types = []

  if (isNow) {
    if (isSingleResource) {
      types = ['numeric', 'line']
    } else {
      types = ['bar', 'numeric']
    }
  } else {
    types = ['line', 'area']
  }

  // 只显示推荐的图表类型
  const filtered = CHART_DEFS.filter(c => types.includes(c.t))
  const sorted = [...filtered].sort((a, b) => types.indexOf(a.t) - types.indexOf(b.t))

  // 当前选中的图表类型（如果在推荐列表中则高亮，否则用第一个）
  const curInList = currentChart.value?.type && types.includes(currentChart.value.type)
  const cur = curInList ? currentChart.value.type : types[0]

  const modeLabel = isNow ? (isSingleResource ? '当前值' : '当前值排名') : '趋势'

  // 检查当前图表类型是否在推荐列表中
  let warning = ''
  if (currentChart.value?.type && !types.includes(currentChart.value.type)) {
    const reasons = []
    if (isNow && isSingleResource && (currentChart.value.type === 'bar' || currentChart.value.type === 'area')) {
      reasons.push('当前值+单资源推荐使用数值卡片')
    }
    if (!isNow && currentChart.value.type === 'numeric') {
      reasons.push('时间段推荐使用折线图或面积图')
    }
    if (isNow && !isSingleResource && currentChart.value.type === 'numeric') {
      reasons.push('当前值+多资源推荐使用柱状图')
    }
    if (reasons.length) warning = reasons.join('，') + '，可能导致显示异常'
  }

  return { items: sorted, types, cur, mode: modeLabel, warning }
})

function toast(msg, duration = 2000) {
  state.toast = msg
  setTimeout(() => { if (state.toast === msg) state.toast = null }, duration)
}

function addChart() {
  // 打开配置面板新建模式，不直接添加到画板
  state.configOpen = true
  state.configTab = 'data'
  state.selectedId = null  // 新建模式，没有选中任何图表
  state.selectedMetrics = []
  state.dsValue = []
  state.period = undefined  // 未选择
  state.interval = undefined  // 未选择
  state.objType = 'all'
  state.aggType = 'max'
  state.topN = 10
  state.selectedResources = []
}

function applyNewChart() {
  const colors = ['#007DFF','#07C160','#FF7D00','#06B6D4','#F5222D']
  const ch = {
    id: state.nextId++,
    title: `图表 ${state.nextId - 1}`,
    type: 'line',
    color: colors[(state.nextId - 1) % colors.length],
    group: '默认分组',
    notes: '',
    legendPosition: 'bottom',
    thresholds: [],
    linkEnabled: false,
    linkUrl: '',
    drillDownUrl: '',
    metrics: [...state.selectedMetrics],
  }
  state.charts.push(ch)
  selectChart(ch.id)
  state.configOpen = false
  toast('图表已添加')
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
  const copy = { ...ch, id: state.nextId++, title: ch.title + ' (副本)', thresholds: [...ch.thresholds], metrics: [...ch.metrics] }
  state.charts.push(copy)
  toast('已复制图表')
}

function selectChart(id) {
  state.selectedId = id
  state.configOpen = true
  switchTab('data')
  const ch = state.charts.find(c => c.id === id)
  if (ch?.metrics?.length) {
    state.selectedMetrics = [...ch.metrics]
  } else {
    state.selectedMetrics = []
  }
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
  state.dsValue = [0, 0]
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

async function refreshChart(chartId) {
  const ch = state.charts.find(c => c.id === chartId)
  if (!ch || !ch.metrics?.length) return
  try {
    const data = await fetchChartData(ch, state.period)
    if (data) chartData[chartId] = data
  } catch {}
}

async function refreshAllCharts() {
  for (const ch of state.charts) {
    await refreshChart(ch.id)
  }
}

function switchDashboard(id) {
  const db = state.dashboards.find(d => d.id === id)
  if (!db) return
  applyDashboard(db)
}

function switchDashboardBySlug(slug) {
  const db = state.dashboards.find(d => d.slug === slug)
  if (!db) return
  applyDashboard(db)
}

function applyDashboard(db) {
  state.currentDashboardId = db.id
  state.charts = db.charts
  state.currentRegion = db.region
  state.period = db.period
  state.editMode = false
  state.configOpen = false
  state.selectedId = null
}

function createNewDashboard() {
  const newId = Math.max(...state.dashboards.map(d => d.id)) + 1
  const newDb = createDashboard(newId, '新仪表盘', state.currentRegion, '24h')
  newDb.charts = []
  state.dashboards.push(newDb)
  state.currentDashboardId = newId
  state.charts = []
  state.editMode = true
  state.configOpen = false
  state.selectedId = null
  toast('已创建新仪表盘')
}

function closeDashboard(id) {
  if (state.dashboards.length <= 1) {
    toast('至少保留一个仪表盘')
    return
  }
  const idx = state.dashboards.findIndex(d => d.id === id)
  if (idx > -1) {
    state.dashboards.splice(idx, 1)
    if (state.currentDashboardId === id) {
      state.currentDashboardId = state.dashboards[0].id
      loadDashboard(state.currentDashboardId)
    }
  }
}

function switchRegion(regionId) {
  state.currentRegion = regionId
  const db = currentDashboard.value
  if (db) db.region = regionId
}

function setPeriod(period) {
  state.period = period
  const db = currentDashboard.value
  if (db) db.period = period
}

function enterEditMode() {
  state.editMode = true
}

function exitEditMode() {
  state.editMode = false
  const db = currentDashboard.value
  if (db) db.charts = [...state.charts]
  toast('已保存')
}

function saveDashboard() {
  const db = currentDashboard.value
  if (db) {
    db.charts = [...state.charts]
    db.region = state.currentRegion
    db.period = state.period
  }
  toast('保存成功')
}

function reorderCharts(newOrder) {
  state.charts = newOrder
}

function setRefreshRate(rate) {
  state.refreshRate = rate
  if (state.refreshInterval) {
    clearInterval(state.refreshInterval)
    state.refreshInterval = null
  }
  if (rate !== '0') {
    const ms = parseInt(rate) * 1000
    state.refreshInterval = setInterval(() => {
      refreshAllCharts()
      state.lastRefresh = new Date().toLocaleTimeString()
    }, ms)
    state.lastRefresh = new Date().toLocaleTimeString()
  }
}

function clearRefresh() {
  if (state.refreshInterval) {
    clearInterval(state.refreshInterval)
    state.refreshInterval = null
  }
  state.refreshRate = '0'
}

export function useEditorState() {
  return {
    CASCADE, ALL_RESOURCES, TH_COLORS, GROUPS, CHART_DEFS, REGIONS, REFRESH_OPTIONS,
    state,
    chartData,
    currentChart, currentCategory, currentSubDataset, availableMetrics, recommendedCharts, currentDashboard,
    toast, addChart, applyNewChart, delChart, dupChart,
    selectChart, closeConfig, switchTab,
    switchDSType, onCategoryChange, onSubDatasetChange,
    toggleMetric, removeMetric, toggleResource, removeResource,
    setObjType, spinTop, pickRec, addThreshold, removeThreshold,
    updateThValue, updateThLevel, toggleLink, getCurrentThresholds,
    refreshChart, refreshAllCharts,
    switchDashboard, switchDashboardBySlug, switchRegion, setPeriod, enterEditMode, exitEditMode, saveDashboard, reorderCharts, createNewDashboard,
    setRefreshRate, clearRefresh,
  }
}
