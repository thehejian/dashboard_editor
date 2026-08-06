<template>
  <div class="error-rate-trend">
    <div class="ert-header">
      <span class="ert-title"><i class="fa-solid fa-chart-line"></i> 故障时间段错误率趋势</span>
      <span class="ert-sub">分钟采样</span>
    </div>
    <div ref="chartContainer" class="ert-chart"></div>
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

const chartContainer = ref(null)
let chart = null

const annotatedPoints = computed(() => props.data.filter(d => d.label || d === props.data[0] || d === props.data[props.data.length - 1]))

function renderChart() {
  if (chart) { chart.destroy(); chart = null }
  if (!chartContainer.value || !props.data.length) return

  chart = new Chart({
    container: chartContainer.value,
    autoFit: true,
    height: 140,
    padding: [10, 40, 20, 50],
  })

  const chartData = props.data.flatMap(d => [
    { time: d.time, type: '延时(ms)', value: d.latency },
    { time: d.time, type: '错误率(%)', value: d.errorRate },
  ])

  chart.data(chartData)

  chart.line()
    .encode('x', 'time')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)

  chart.point()
    .encode('x', 'time')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)

  chart.legend('color', { position: 'top', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  chart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
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
.ert-chart { width: 100%; }
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
