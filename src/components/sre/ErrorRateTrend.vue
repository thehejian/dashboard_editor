<template>
  <div class="error-rate-trend">
    <div class="ert-header">
      <span class="ert-title"><i class="fa-solid fa-chart-line"></i> {{ appName ? appName + ' - ' : '' }}故障时间段错误率趋势</span>
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
    <div v-if="annotations.length" class="ert-timeline-bar">
      <div v-for="(a, i) in annotations" :key="i" class="ert-tl-item" :class="'ert-tl-' + a.type">
        <span class="ert-tl-dot"></span>
        <span class="ert-tl-time">{{ a.time }}</span>
        <span class="ert-tl-label">{{ a.label }}</span>
      </div>
    </div>
    <div v-if="executionResults.length" class="ert-exec-results">
      <div class="ert-er-title"><i class="fa-solid fa-chart-simple"></i> 执行效果对比</div>
      <div class="ert-er-row" v-for="(r, i) in executionResults" :key="i">
        <span class="ert-er-step">{{ r.step }}</span>
        <span class="ert-er-before">{{ r.before }}<span class="ert-er-unit">{{ r.unit }}</span></span>
        <span class="ert-er-arrow"><i class="fa-solid fa-arrow-right"></i></span>
        <span class="ert-er-after">{{ r.after }}<span class="ert-er-unit">{{ r.unit }}</span></span>
        <span class="ert-er-status" :class="r.after === 0 ? 'er-ok' : 'er-improving'">
          {{ r.after === 0 ? '已恢复' : (r.after < r.before ? '改善中' : '') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const props = defineProps({
  data: { type: [Array, Object], default: () => [] },
  appName: { type: String, default: '' },
})

const chartWrapper = ref(null)
const chartContainer = ref(null)
const tooltipData = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
let chart = null

const trendData = computed(() => Array.isArray(props.data) ? props.data : (props.data?.data || []))
const annotations = computed(() => Array.isArray(props.data) ? [] : (props.data?.annotations || []))
const executionResults = computed(() => Array.isArray(props.data) ? [] : (props.data?.executionResults || []))

const annotatedPoints = computed(() => trendData.value.filter(d => d.label || d === trendData.value[0] || d === trendData.value[trendData.value.length - 1]))

function hideTooltip() {
  tooltipData.value = null
}

function onMouseMove(e) {
  if (!trendData.value.length || !chartContainer.value) return
  const rect = chartContainer.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const chartWidth = rect.width
  const padding = { left: 10, right: 10 }
  const plotWidth = chartWidth - padding.left - padding.right
  const ratio = (x - padding.left) / plotWidth
  const idx = Math.round(ratio * (trendData.value.length - 1))
  if (idx >= 0 && idx < trendData.value.length) {
    tooltipData.value = trendData.value[idx]
    tooltipX.value = e.clientX - chartWrapper.value.getBoundingClientRect().left + 12
    tooltipY.value = e.clientY - chartWrapper.value.getBoundingClientRect().top - 50
  }
}

function renderChart() {
  if (chart) { chart.destroy(); chart = null }
  if (!chartContainer.value || !trendData.value.length) return

  chart = new Chart({
    container: chartContainer.value,
    autoFit: true,
    height: 140,
    padding: [10, 10, 4, 40],
  })

  const combinedData = []
  trendData.value.forEach(d => {
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
.ert-chart-wrapper { position: relative; height: 140px; flex-shrink: 0; }
.ert-chart { width: 100%; height: 140px; }
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
.ert-timeline-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; padding: 4px 8px; background: #fafafa; border-radius: 4px; }
.ert-tl-item { display: flex; align-items: center; gap: 4px; font-size: 10px; }
.ert-tl-dot { width: 6px; height: 6px; border-radius: 50%; }
.ert-tl-alert .ert-tl-dot { background: #F5222D; }
.ert-tl-action .ert-tl-dot { background: #1890ff; }
.ert-tl-recovery .ert-tl-dot { background: #52c41a; }
.ert-tl-detection .ert-tl-dot { background: #722ED1; }
.ert-tl-time { font-family: monospace; color: #8c8c8c; }
.ert-tl-label { color: #666; font-weight: 500; }
.ert-exec-results { margin-top: 4px; padding: 6px 8px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; }
.ert-er-title { font-size: 11px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.ert-er-title i { color: #52c41a; margin-right: 4px; }
.ert-er-row { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.8; }
.ert-er-step { font-weight: 500; color: #1a1a1a; min-width: 60px; }
.ert-er-before { color: #F5222D; }
.ert-er-after { color: #52c41a; font-weight: 600; }
.ert-er-unit { font-size: 10px; color: #8c8c8c; margin-left: 1px; }
.ert-er-arrow { color: #8c8c8c; font-size: 10px; }
.ert-er-status { font-size: 10px; font-weight: 500; }
.er-ok { color: #52c41a; }
.er-improving { color: #FF7D00; }

@media (max-width: 768px) {
  .error-rate-trend { padding: 6px 8px; border-radius: 0; border-left: none; border-right: none; }
  .ert-title { font-size: 12px; }
  .ert-annotations { gap: 8px; }
  .ert-annotation { font-size: 10px; }
}
</style>
