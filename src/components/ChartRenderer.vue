<template>
  <div v-if="type === 'numeric'" class="numeric-wrap" v-html="renderNumericSVG(displayColor, realValue)"></div>
  <div v-else ref="container" class="chart-renderer"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const props = defineProps({
  type: { type: String, default: 'line' },
  color: { type: String, default: '#007DFF' },
  data: { type: Object, default: null },
  thresholds: { type: Array, default: () => [] },
})

const TH_COLORS = {
  danger: '#F5222D',
  warning: '#FF7D00',
  info: '#007DFF',
  normal: '#07C160',
}

const displayColor = computed(() => {
  const val = realValue.value
  if (val == null) return props.color
  for (const th of props.thresholds) {
    if (val >= th.value) {
      return TH_COLORS[th.level] || props.color
    }
  }
  return TH_COLORS.normal
})

const container = ref(null)
let chart = null

const DATA = {
  line: [
    { time: '00:00', value: 12 }, { time: '04:00', value: 45 }, { time: '08:00', value: 68 },
    { time: '12:00', value: 52 }, { time: '16:00', value: 86 }, { time: '20:00', value: 34 },
  ],
  area: [
    { time: '00:00', value: 30 }, { time: '04:00', value: 55 }, { time: '08:00', value: 78 },
    { time: '12:00', value: 62 }, { time: '16:00', value: 90 }, { time: '20:00', value: 48 },
  ],
  bar: [
    { item: 'Mon', value: 120 }, { item: 'Tue', value: 200 }, { item: 'Wed', value: 150 },
    { item: 'Thu', value: 80 }, { item: 'Fri', value: 70 }, { item: 'Sat', value: 110 },
    { item: 'Sun', value: 130 },
  ],
}

const realValue = computed(() => {
  if (!props.data) return null
  return props.data.lastValue
})

const fmtBytes = (v) => {
  if (v >= 1048576) return (v / 1048576).toFixed(1) + 'M'
  if (v >= 1024) return (v / 1024).toFixed(1) + 'K'
  return v.toFixed(1)
}

function clamp(v, max) {
  return Math.min(Math.abs(v), max) * Math.sign(v)
}

function renderNumericSVG(c, val) {
  const displayVal = val != null
    ? (props.data?.unit === 'bytes/s' ? fmtBytes(val) : Math.round(val * 10) / 10 + '%')
    : '2,847'
  const trend = val != null ? (val >= 0 ? '+12.4%' : '-3.2%') : '+12.4%'
  const trendColor = val != null && val < 0 ? '#07C160' : '#07C160'
  const safeVal = val != null ? clamp(val, 99999) : 2847
  const waveH = Math.max(40, Math.min(60, 30 + Math.abs(safeVal) / 100))

  return `<svg viewBox="0 0 340 165" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,sans-serif"><rect x="0" y="0" width="340" height="165" fill="#FAFBFC" rx="4"/><defs><linearGradient id="lg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.2"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><text x="170" y="72" text-anchor="middle" dominant-baseline="central" font-size="48" font-weight="700" fill="${c}">${displayVal}</text><text x="170" y="106" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#9CA3AF">监控数值</text><path d="M 190,128 C 205,125 215,132 228,126 C 241,120 254,129 267,124 C 280,119 293,126 306,121" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/><text x="308" y="118" text-anchor="end" font-family="Inter,sans-serif" font-size="10" fill="${trendColor}" opacity="0.8">${trend}</text><text x="170" y="148" text-anchor="middle" font-size="9" fill="#E5E5EA">● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●</text></svg>`
}

function renderChart() {
  if (chart) { chart.destroy(); chart = null }
  if (!container.value || props.type === 'numeric') return

  const useData = props.data?.points || DATA[props.type]
  if (!useData || !useData.length) return

  const c = props.color

  if (container.value.clientWidth > 0 && container.value.clientHeight === 0) {
    container.value.style.minHeight = '155px'
  }

  chart = new Chart({
    container: container.value,
    autoFit: true,
    padding: [8, 8, 16, 36],
  })

  if (props.type === 'line') {
    chart.area()
      .data(useData)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', `l(0) 0:${c}20 1:${c}00`)
      .style('shape', 'smooth')
    chart.line()
      .data(useData)
      .encode('x', 'time').encode('y', 'value')
      .style('stroke', c).style('lineWidth', 2)
      .style('shape', 'smooth')
    chart.point()
      .data(useData)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', c).style('stroke', '#FFF')
      .style('lineWidth', 1.5).style('size', 3)
  } else if (props.type === 'area') {
    chart.area()
      .data(useData)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', `l(0) 0:${c}60 1:${c}05`)
      .style('shape', 'smooth')
    chart.line()
      .data(useData)
      .encode('x', 'time').encode('y', 'value')
      .style('stroke', c).style('lineWidth', 2)
      .style('shape', 'smooth')
  } else if (props.type === 'bar') {
    chart.interval()
      .data(useData)
      .encode('x', 'item').encode('y', 'value')
      .style('fill', c).style('radius', [2, 2, 0, 0])
  }

  chart.axis('x', { labelFontSize: 9, labelFill: '#9CA3AF', title: null })
  chart.axis('y', { labelFontSize: 9, labelFill: '#9CA3AF', gridStroke: '#E5E5EA', gridLineWidth: 1, title: null })
  chart.render()
}

onMounted(() => { renderChart() })

watch(
  () => [props.type, props.color, props.data],
  () => nextTick(() => renderChart()),
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null }
})
</script>

<style scoped>
.chart-renderer { flex: 1; min-height: 155px; min-width: 0; }
.numeric-wrap { flex: 1; min-height: 155px; min-width: 0; display: flex; }
.numeric-wrap svg { width: 100%; height: 100%; }
</style>
