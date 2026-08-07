<template>
  <div class="error-rate-trend">
    <div class="ert-header">
      <span class="ert-title"><i class="fa-solid fa-chart-line"></i> 故障时间段错误率趋势</span>
      <span class="ert-sub">分钟采样</span>
    </div>
    <div class="ert-legend">
      <span class="ert-legend-item"><i class="ert-dot" style="background:#1890FF"></i>延时(ms)</span>
      <span class="ert-legend-item"><i class="ert-dot" style="background:#FF7D00"></i>错误率(%)</span>
    </div>
    <div ref="chartWrapper" class="ert-chart-wrapper" @mousemove="onMouseMove" @mouseleave="hideTooltip">
      <div ref="chartContainer" class="ert-chart"></div>
      <div v-if="tooltipData" class="ert-tooltip" :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
        <div class="ert-tooltip-title">{{ tooltipData.time }}</div>
        <div class="ert-tooltip-item">
          <span class="ert-tooltip-dot" style="background:#1890FF"></span>
          <span class="ert-tooltip-label">延时</span>
          <span class="ert-tooltip-value">{{ tooltipData.latency }}ms</span>
        </div>
        <div class="ert-tooltip-item">
          <span class="ert-tooltip-dot" style="background:#FF7D00"></span>
          <span class="ert-tooltip-label">错误率</span>
          <span class="ert-tooltip-value">{{ tooltipData.errorRate }}%</span>
        </div>
      </div>
    </div>
    <div class="ert-annotations">
      <div v-for="(point, i) in annotatedPoints" :key="i" class="ert-annotation">
        <span class="ert-a-time">{{ point.time }}</span>
        <span class="ert-a-label">延时: {{ point.latency }}ms / 错误率: {{ point.errorRate }}%</span>
        <span v-if="point.label" class="ert-a-event">{{ point.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const chartWrapper = ref(null)
const chartContainer = ref(null)
const tooltipData = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
let chart = null

const annotatedPoints = computed(() => props.data.filter(d => d.label || d === props.data[0] || d === props.data[props.data.length - 1]))

function hideTooltip() {
  tooltipData.value = null
}

function onMouseMove(e) {
  if (!props.data.length || !chartContainer.value) return
  const rect = chartContainer.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const chartWidth = rect.width
  const padding = { left: 10, right: 10 }
  const plotWidth = chartWidth - padding.left - padding.right
  const ratio = (x - padding.left) / plotWidth
  const idx = Math.round(ratio * (props.data.length - 1))
  if (idx >= 0 && idx < props.data.length) {
    tooltipData.value = props.data[idx]
    tooltipX.value = e.clientX - chartWrapper.value.getBoundingClientRect().left + 12
    tooltipY.value = e.clientY - chartWrapper.value.getBoundingClientRect().top - 50
  }
}

function renderChart() {
  if (chart) { chart.destroy(); chart = null }
  if (!chartContainer.value || !props.data.length) return

  chart = new Chart({
    container: chartContainer.value,
    autoFit: true,
    height: 140,
    padding: [10, 10, 24, 40],
  })

  const combinedData = []
  props.data.forEach(d => {
    combinedData.push({ time: d.time, value: d.latency, type: '延时(ms)' })
    combinedData.push({ time: d.time, value: d.errorRate, type: '错误率(%)' })
  })

  chart.data(combinedData)

  chart.line()
    .encode('x', 'time')
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('color', { range: ['#1890FF', '#FF7D00'] })
    .style('lineWidth', 2)
    .tooltip(false)

  chart.point()
    .encode('x', 'time')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)
    .tooltip(false)

  chart.axis('x', false)
  chart.axis('y', false)
  chart.scale('y', { type: 'linear', nice: true })

  chart.render()
}

onMounted(() => { nextTick(() => setTimeout(renderChart, 100)) })
onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null } })
watch(() => props.data, () => { nextTick(() => setTimeout(renderChart, 100)) }, { deep: true })
</script>

<style scoped>
.error-rate-trend {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.ert-title { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.ert-title i { color: #FF7D00; margin-right: 4px; }
.ert-sub { font-size: 11px; color: #8c8c8c; }
.ert-legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 2px; }
.ert-legend-item { font-size: 11px; color: #666; display: flex; align-items: center; gap: 4px; }
.ert-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.ert-chart-wrapper { position: relative; flex: 1; min-height: 0; }
.ert-chart { width: 100%; height: 100%; }
.ert-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
}
.ert-tooltip-title { font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; }
.ert-tooltip-item { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.ert-tooltip-dot { width: 8px; height: 8px; border-radius: 50%; }
.ert-tooltip-label { color: rgba(255,255,255,0.7); }
.ert-tooltip-value { font-weight: 500; }
.ert-annotations {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}
.ert-annotation {
  font-size: 11px;
  color: #666;
}
.ert-a-time { font-weight: 600; color: #1a1a1a; margin-right: 4px; }
.ert-a-event { color: #FF7D00; font-weight: 500; margin-left: 4px; }

@media (max-width: 768px) {
  .error-rate-trend { padding: 6px 8px; border-radius: 0; border-left: none; border-right: none; }
  .ert-title { font-size: 12px; }
  .ert-annotations { gap: 8px; }
  .ert-annotation { font-size: 10px; }
}
</style>
