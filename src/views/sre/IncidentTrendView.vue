<template>
  <div class="page-view">
    <div class="page-header"><h3>故障趋势</h3></div>
    <div v-if="loading" style="text-align:center;margin:60px 0"><a-spin /></div>
    <template v-else>
      <div class="trend-summary">
        <div class="trend-summary-card"><span class="tsc-val">{{ data.summary.totalIncidents }}</span><span class="tsc-label">总故障</span></div>
        <div class="trend-summary-card"><span class="tsc-val" style="color:#cf1322">{{ data.summary.p1 }}</span><span class="tsc-label">P1</span></div>
        <div class="trend-summary-card"><span class="tsc-val" style="color:#d46b08">{{ data.summary.p2 }}</span><span class="tsc-label">P2</span></div>
        <div class="trend-summary-card"><span class="tsc-val" style="color:#d48806">{{ data.summary.p3 }}</span><span class="tsc-label">P3</span></div>
        <div class="trend-summary-card"><span class="tsc-val">{{ data.summary.avgMttr }}min</span><span class="tsc-label">平均恢复</span></div>
        <div class="trend-summary-card"><span class="tsc-val" style="color:#389e0d">{{ data.summary.selfHealSuccessRate }}%</span><span class="tsc-label">自愈成功率</span></div>
      </div>
      <div class="trend-chart-section">
        <h4>故障次数趋势 (近30天)</h4>
        <div class="trend-chart" ref="trendChartRef"></div>
      </div>
      <div class="trend-section-row">
        <div class="trend-chart-section" style="flex:1">
          <h4>按应用分布</h4>
          <div class="trend-chart" ref="byAppChartRef"></div>
        </div>
        <div class="trend-chart-section" style="flex:1">
          <h4>级别占比</h4>
          <div class="trend-chart" ref="pieChartRef"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const loading = ref(true)
const data = ref({ days: [], byApp: [], summary: {} })
const trendChartRef = ref(null)
const byAppChartRef = ref(null)
const pieChartRef = ref(null)

function renderTrend() {
  if (!trendChartRef.value) return
  const chart = new Chart({ container: trendChartRef.value, autoFit: true, height: 200, padding: [8, 8, 8, 8] })
  chart.data(data.value.days.map(d => ({ date: d.date, total: d.total, mttr: d.mttr })))
  chart.line().encode('x', 'date').encode('y', 'total').encode('color', () => '故障次数').style('lineWidth', 2).style('stroke', '#1890ff')
  chart.area().encode('x', 'date').encode('y', 'total').style('fill', 'rgba(24,144,255,0.1)')
  chart.axis('y', { title: '次数' })
  chart.interaction('tooltip', {})
  chart.render()
}

function renderByApp() {
  if (!byAppChartRef.value) return
  const chart = new Chart({ container: byAppChartRef.value, autoFit: true, height: 200, padding: [8, 8, 8, 8] })
  chart.data(data.value.byApp.map(a => ({ app: a.app, count: a.count })))
  chart.interval().encode('x', 'app').encode('y', 'count').encode('color', 'app').style('radius', 4)
  chart.axis('x', { label: { autoRotate: true, fontSize: 10 } })
  chart.interaction('tooltip', {})
  chart.render()
}

function renderPie() {
  if (!pieChartRef.value) return
  const pieData = [
    { name: 'P1', value: data.value.summary.p1 },
    { name: 'P2', value: data.value.summary.p2 },
    { name: 'P3', value: data.value.summary.p3 },
  ].filter(d => d.value > 0)
  const chart = new Chart({ container: pieChartRef.value, autoFit: true, height: 200, padding: [8, 8, 8, 8] })
  chart.coordinate({ type: 'theta', innerRadius: 0.5 })
  chart.data(pieData)
  chart.interval().encode('y', 'value').encode('color', 'name').style('stroke', '#fff').style('lineWidth', 1)
  chart.label({ text: 'name', position: 'outside', fontSize: 10 })
  chart.interaction('tooltip', {})
  chart.render()
}

onMounted(async () => {
  try {
    const res = await fetch('/api/sre/incident-trend')
    const json = await res.json()
    if (json.success) data.value = json.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  nextTick(() => { renderTrend(); renderByApp(); renderPie() })
})
</script>

<style scoped>
.trend-summary { display:flex;gap:12px;margin-bottom:20px; }
.trend-summary-card { flex:1;background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);display:flex;flex-direction:column;align-items:center; }
.tsc-val { font-size:24px;font-weight:700;line-height:1.2; }
.tsc-label { font-size:12px;color:#6B7280;margin-top:2px; }
.trend-chart-section { background:#fff;border-radius:10px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);margin-bottom:16px; }
.trend-chart-section h4 { margin:0 0 8px;font-size:13px;font-weight:600;color:#1a1a1a; }
.trend-chart { width:100%;min-height:200px; }
.trend-section-row { display:flex;gap:16px; }
</style>