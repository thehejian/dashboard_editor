<template>
  <div class="overview-panel">
    <div class="ov-section">
      <h4>基本信息</h4>
      <div class="ov-info-grid">
        <div class="ov-info-item"><span class="ov-label">名称</span><span class="ov-value">{{ resource.name }}</span></div>
        <div class="ov-info-item"><span class="ov-label">标识</span><span class="ov-value ov-mono">{{ resource.identifier }}</span></div>
        <div class="ov-info-item">
          <span class="ov-label">告警状态</span>
          <span class="ov-value"><a-tag :color="resource.alertStatus === '紧急' ? 'red' : 'green'" size="small">{{ resource.alertStatus }}</a-tag></span>
        </div>
        <div class="ov-info-item">
          <span class="ov-label">运行状态</span>
          <span class="ov-value"><span class="ov-status-dot dot-running"></span> 运行中</span>
        </div>
        <div class="ov-info-item"><span class="ov-label">应用级别</span><span class="ov-value">{{ resource.appLevel }}</span></div>
        <div class="ov-info-item"><span class="ov-label">所属VDC</span><span class="ov-value">{{ resource.vdc }}</span></div>
        <div class="ov-info-item"><span class="ov-label">负责人</span><span class="ov-value">{{ resource.owner }}</span></div>
        <div class="ov-info-item"><span class="ov-label">来源</span><span class="ov-value">{{ resource.source }}</span></div>
      </div>
    </div>

    <div class="ov-section">
      <div class="ov-metrics-header">
        <h4>指标监控</h4>
        <a-select v-model:value="metricFilter" size="small" style="width: 140px" placeholder="全部">
          <a-select-option value="all">全部</a-select-option>
          <a-select-option v-for="opt in metricFilterOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</a-select-option>
        </a-select>
      </div>
    </div>

    <div v-for="group in filteredMetricGroups" :key="group.key" class="ov-section">
      <h4 class="ov-group-toggle" @click="toggleMetricGroup(group.key)">
        <i class="fa-solid group-chevron" :class="metricGroupCollapsed[group.key] ? 'fa-chevron-right' : 'fa-chevron-down'"></i>
        <i :class="group.icon" class="ov-group-icon"></i>{{ group.label }}
        <span class="ov-group-count">{{ group.items.length }} 项</span>
      </h4>
      <div v-show="!metricGroupCollapsed[group.key]" class="ov-metric-grid">
        <div v-for="m in group.items" :key="m.key" class="ov-metric-card">
          <div class="ov-mc-top">
            <span class="ov-mc-label">{{ m.label }}</span>
            <span class="ov-mc-trend" :class="m.trend > 0 ? 'trend-up' : 'trend-down'">
              <i :class="m.trend > 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              {{ Math.abs(m.trend) }}%
            </span>
          </div>
          <div class="ov-mc-value" :style="{ color: getValueColor(m) }">
            {{ m.value }}<span class="ov-mc-unit">{{ m.unit || '' }}</span>
          </div>
          <div class="ov-mc-spark">
            <canvas :ref="el => setCanvasRef(m.key, el)"></canvas>
          </div>
          <div class="ov-mc-range">
            <span>24h最低 {{ m.min }}{{ m.unit || '' }}</span>
            <span>24h最高 {{ m.max }}{{ m.unit || '' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  resource: { type: Object, default: () => ({
    name: '订单服务中心', identifier: 'order-svc-prod-01', alertStatus: '紧急',
    appLevel: '重要应用', vdc: 'VDC-BJ-01', owner: '张伟', source: '运营'
  })},
})

const metricFilter = ref('all')
const metricFilterOptions = [
  { key: 'compute', label: '计算资源' },
  { key: 'network', label: '网络' },
  { key: 'disk', label: '磁盘' },
  { key: 'app', label: '应用性能' },
  { key: 'system', label: '系统' },
]

const metricGroupCollapsed = reactive({})

function toggleMetricGroup(key) {
  metricGroupCollapsed[key] = !metricGroupCollapsed[key]
}

const canvasRefs = reactive({})
function setCanvasRef(key, el) { if (el) canvasRefs[key] = el }

function genTrend(base, variance, count = 24) {
  const arr = []
  let v = base - variance * 2
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.45) * variance
    v = Math.max(base * 0.3, Math.min(base * 1.5, v))
    arr.push(v)
  }
  arr[count - 1] = base
  return arr
}

const metricGroups = reactive([
  { key: 'compute', label: '计算资源', icon: 'fa-solid fa-microchip', items: [
    { key: 'cpu', label: 'CPU 使用率', value: 87, unit: '%', trend: 7.9, threshold: 80, min: 62, max: 95, data: [] },
    { key: 'mem', label: '内存使用率', value: 92, unit: '%', trend: 10.7, threshold: 80, min: 78, max: 96, data: [] },
    { key: 'proc', label: '进程数', value: 128, unit: '', trend: -2.5, threshold: 200, min: 115, max: 142, data: [] },
    { key: 'thread', label: '线程数', value: 1560, unit: '', trend: -3.7, threshold: 2000, min: 1420, max: 1680, data: [] },
  ]},
  { key: 'network', label: '网络', icon: 'fa-solid fa-network-wired', items: [
    { key: 'req', label: '请求速率', value: 1560, unit: ' req/s', trend: -3.1, threshold: 2000, min: 980, max: 1820, data: [] },
    { key: 'conn', label: '连接数', value: 128, unit: '', trend: 0.7, threshold: 200, min: 85, max: 165, data: [] },
    { key: 'bw', label: '带宽利用率', value: 34, unit: '%', trend: 1.9, threshold: 80, min: 18, max: 52, data: [] },
  ]},
  { key: 'disk', label: '磁盘', icon: 'fa-solid fa-hard-drive', items: [
    { key: 'disk', label: '磁盘使用率', value: 56, unit: '%', trend: -7.6, threshold: 85, min: 48, max: 68, data: [] },
    { key: 'diskR', label: '磁盘读速率', value: 45, unit: ' MB/s', trend: -5.8, threshold: 100, min: 22, max: 78, data: [] },
    { key: 'diskW', label: '磁盘写速率', value: 32, unit: ' MB/s', trend: 4.8, threshold: 100, min: 15, max: 55, data: [] },
    { key: 'iops', label: 'IOPS', value: 1230, unit: '', trend: 5.7, threshold: 2000, min: 680, max: 1580, data: [] },
    { key: 'openFd', label: '打开文件数', value: 234, unit: '', trend: 10.4, threshold: 500, min: 156, max: 298, data: [] },
  ]},
  { key: 'app', label: '应用性能', icon: 'fa-solid fa-gauge-high', items: [
    { key: 'err', label: '错误率', value: 3.2, unit: '%', trend: 2, threshold: 5, min: 0.8, max: 5.1, data: [] },
    { key: 'latency', label: '响应时间', value: 245, unit: ' ms', trend: 6.2, threshold: 500, min: 120, max: 380, data: [] },
    { key: 'p99', label: 'P99 延迟', value: 320, unit: ' ms', trend: -3.5, threshold: 500, min: 180, max: 460, data: [] },
    { key: 'gc', label: 'GC 暂停', value: 45, unit: ' ms', trend: -5.5, threshold: 100, min: 20, max: 85, data: [] },
  ]},
  { key: 'system', label: '系统', icon: 'fa-solid fa-server', items: [
    { key: 'fd', label: '文件描述符', value: 890, unit: ' / 65535', trend: -4.6, threshold: 50000, min: 720, max: 1120, data: [] },
  ]},
])

const filteredMetricGroups = computed(() => {
  if (metricFilter.value === 'all') return metricGroups
  return metricGroups.filter(g => g.key === metricFilter.value)
})

function getValueColor(m) {
  if (!m.threshold) return '#1a1a1a'
  const ratio = m.value / m.threshold
  if (ratio >= 0.9) return '#f5222d'
  if (ratio >= 0.7) return '#fa8c16'
  return '#52c41a'
}

function drawSparkline(canvas, data, color) {
  if (!canvas || !data?.length) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, color + '30')
  gradient.addColorStop(1, color + '05')

  ctx.beginPath()
  ctx.moveTo(0, h)
  data.forEach((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 4) - 2
    if (i === 0) ctx.lineTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  data.forEach((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 4) - 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()

  const lastX = (data.length - 1) * step
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 4) - 2
  ctx.beginPath()
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function drawAllSparklines() {
  nextTick(() => {
    metricGroups.forEach(group => {
      group.items.forEach(m => {
        const canvas = canvasRefs[m.key]
        if (canvas) {
          const color = getValueColor(m) === '#f5222d' ? '#f5222d' : getValueColor(m) === '#fa8c16' ? '#fa8c16' : '#1890ff'
          drawSparkline(canvas, m.data, color)
        }
      })
    })
  })
}

onMounted(() => {
  metricGroups.forEach(group => {
    group.items.forEach(m => {
      m.data = genTrend(m.value, m.value * 0.15)
    })
  })
  drawAllSparklines()
})
</script>

<style scoped>
.overview-panel { padding: 16px 20px; }
.ov-section { margin-bottom: 24px; }
.ov-section h4 { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; }

.ov-metrics-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.ov-metrics-header h4 { margin: 0; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }

.ov-group-toggle { cursor: pointer; user-select: none; }
.ov-group-toggle:hover { color: #1890ff; }
.group-chevron { font-size: 11px; color: #8c8c8c; width: 14px; transition: transform 0.2s; }
.ov-group-icon { margin-right: 4px; color: #1890ff; }
.ov-group-count { margin-left: auto; font-size: 12px; color: #8c8c8c; font-weight: 400; }

.ov-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ov-info-item { display: flex; align-items: center; padding: 8px 12px; background: #fafafa; border-radius: 6px; }
.ov-label { font-size: 12px; color: #8c8c8c; min-width: 64px; flex-shrink: 0; }
.ov-value { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.ov-mono { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
.ov-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #52c41a; display: inline-block; margin-right: 4px; }

.ov-metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.ov-metric-card { background: #fafafa; border-radius: 8px; padding: 12px; }
.ov-mc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.ov-mc-label { font-size: 12px; color: #8c8c8c; }
.ov-mc-trend { font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 2px; }
.trend-up { color: #f5222d; }
.trend-down { color: #52c41a; }
.ov-mc-value { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; line-height: 1; }
.ov-mc-unit { font-size: 12px; font-weight: 400; color: #8c8c8c; }
.ov-mc-spark { height: 52px; margin: 4px 0; }
.ov-mc-spark canvas { width: 100%; height: 100%; display: block; }
.ov-mc-range { display: flex; justify-content: space-between; font-size: 10px; color: #bfbfbf; }

@media (max-width: 768px) {
  .ov-info-grid { grid-template-columns: 1fr; }
  .ov-metric-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .ov-metric-grid { grid-template-columns: 1fr; }
}
</style>
