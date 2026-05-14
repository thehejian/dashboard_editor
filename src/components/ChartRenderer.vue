<template>
  <div v-if="type === 'numeric'" class="numeric-wrap" v-html="renderNumericSVG(color)"></div>
  <div v-else ref="container" class="chart-renderer"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const props = defineProps({
  type: { type: String, default: 'line' },
  color: { type: String, default: '#007DFF' },
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

function renderNumericSVG(c) {
  return `<svg viewBox="0 0 340 165" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,sans-serif"><rect x="0" y="0" width="340" height="165" fill="#FAFBFC" rx="4"/><defs><linearGradient id="lg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.2"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><text x="170" y="72" text-anchor="middle" dominant-baseline="central" font-size="48" font-weight="700" fill="${c}">2,847</text><text x="170" y="106" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#9CA3AF">监控数值</text><path d="M 190,128 C 205,125 215,132 228,126 C 241,120 254,129 267,124 C 280,119 293,126 306,121" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/><text x="308" y="118" text-anchor="end" font-family="Inter,sans-serif" font-size="10" fill="#07C160" opacity="0.8">+12.4%</text><text x="170" y="148" text-anchor="middle" font-size="9" fill="#E5E5EA">● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●</text></svg>`
}

function renderChart() {
  if (chart) { chart.destroy(); chart = null }
  if (!container.value || props.type === 'numeric') return

  const c = props.color
  const data = DATA[props.type] || DATA.line

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
      .data(data)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', `l(0) 0:${c}20 1:${c}00`)
      .style('shape', 'smooth')
    chart.line()
      .data(data)
      .encode('x', 'time').encode('y', 'value')
      .style('stroke', c).style('lineWidth', 2)
      .style('shape', 'smooth')
    chart.point()
      .data(data)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', c).style('stroke', '#FFF')
      .style('lineWidth', 1.5).style('size', 3)
  } else if (props.type === 'area') {
    chart.area()
      .data(data)
      .encode('x', 'time').encode('y', 'value')
      .style('fill', `l(0) 0:${c}60 1:${c}05`)
      .style('shape', 'smooth')
    chart.line()
      .data(data)
      .encode('x', 'time').encode('y', 'value')
      .style('stroke', c).style('lineWidth', 2)
      .style('shape', 'smooth')
  } else if (props.type === 'bar') {
    chart.interval()
      .data(data)
      .encode('x', 'item').encode('y', 'value')
      .style('fill', c).style('radius', [2, 2, 0, 0])
  }

  chart.axis('x', { labelFontSize: 9, labelFill: '#9CA3AF', title: null })
  chart.axis('y', { labelFontSize: 9, labelFill: '#9CA3AF', gridStroke: '#E5E5EA', gridLineWidth: 1, title: null })
  chart.render()
}

onMounted(() => { renderChart() })

watch(
  () => [props.type, props.color],
  () => nextTick(() => renderChart()),
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null }
})
</script>

<style scoped>
.chart-renderer { flex: 1; min-height: 155px; min-width: 0; }
.numeric-wrap { flex: 1; min-height: 155px; min-width: 0; }
.numeric-wrap svg { width: 100%; height: 100%; }
</style>
