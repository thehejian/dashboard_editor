<template>
  <div>
    <div class="breadcrumb"><span>异常事件管理</span> / <span>概览</span></div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-icon stat-icon-total"><i class="fa-solid fa-chart-simple"></i></div><div class="stat-info"><div class="stat-label">事件总数</div><div class="stat-value">1,286</div><div class="stat-trend trend-up">↑ 12.5% 较昨日</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-critical"><i class="fa-solid fa-circle"></i></div><div class="stat-info"><div class="stat-label">紧急事件</div><div class="stat-value stat-value-critical">3</div><div class="stat-trend trend-down">↓ 2 较昨日</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-major"><i class="fa-solid fa-circle"></i></div><div class="stat-info"><div class="stat-label">重要事件</div><div class="stat-value stat-value-major">28</div><div class="stat-trend trend-up">↑ 5 较昨日</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-minor"><i class="fa-solid fa-circle"></i></div><div class="stat-info"><div class="stat-label">次要事件</div><div class="stat-value stat-value-minor">156</div><div class="stat-trend trend-up">↑ 18 较昨日</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-warning"><i class="fa-solid fa-circle"></i></div><div class="stat-info"><div class="stat-label">提示事件</div><div class="stat-value stat-value-warning">1,099</div><div class="stat-trend trend-up">↑ 127 较昨日</div></div></div>
    </div>
    <div class="chart-grid">
      <div class="chart-card chart-card-wide">
        <div class="chart-header"><span class="chart-title">事件趋势图</span>
          <a-radio-group v-model:value="trendRange" size="small" button-style="solid" @change="renderTrendChart">
            <a-radio-button value="24h">近 24 小时</a-radio-button>
            <a-radio-button value="7d">近 7 天</a-radio-button>
            <a-radio-button value="30d">近 30 天</a-radio-button>
          </a-radio-group>
        </div>
        <div ref="trendChartRef" class="chart-body"></div>
      </div>
      <div class="chart-card"><div class="chart-header"><span class="chart-title">按来源分布</span></div><div ref="sourceChartRef" class="chart-body"></div></div>
      <div class="chart-card"><div class="chart-header"><span class="chart-title">按级别分布</span></div><div ref="levelChartRef" class="chart-body"></div></div>
      <div class="chart-card chart-card-wide">
        <div class="chart-header"><span class="chart-title">按资源类型分布</span></div>
        <div ref="resourceChartRef" class="chart-body"></div>
      </div>
      <div class="chart-card chart-card-wide">
        <div class="chart-header"><span class="chart-title">触发次数最多的规则</span></div>
        <div ref="rulesChartRef" class="chart-body"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Chart } from '@antv/g2'
import { MOCK_CHART_DATA, EVENT_LEVEL_COLORS } from './mockData.js'

const trendRange = ref('7d')
const trendChartRef = ref(null)
const sourceChartRef = ref(null)
const levelChartRef = ref(null)
const resourceChartRef = ref(null)
const rulesChartRef = ref(null)

let trendChart = null
let sourceChart = null
let levelChart = null
let resourceChart = null
let rulesChart = null

function renderTrendChart() {
  if (trendChart) trendChart.destroy()
  const data = MOCK_CHART_DATA.trend.flatMap(d => [
    { date: d.date, type: '紧急', value: d.critical },
    { date: d.date, type: '重要', value: d.major },
    { date: d.date, type: '次要', value: d.minor },
    { date: d.date, type: '提示', value: d.warning },
  ])
  trendChart = new Chart({ container: trendChartRef.value, autoFit: true, height: 260 })
  trendChart.data(data)
  trendChart.interval().encode('x', 'date').encode('y', 'value').encode('color', 'type').encode('series', 'type').transform({ type: 'stackY' }).scale('color', { range: ['#ff4d4f', '#fa8c16', '#1890ff', '#faad14'] })
  trendChart.axis('x', { label: { fontSize: 11 } })
  trendChart.axis('y', { label: { fontSize: 11 } })
  trendChart.legend(false)
  trendChart.interaction('tooltip', { shared: true })
  trendChart.render()
}

function renderSourceChart() {
  if (sourceChart) sourceChart.destroy()
  sourceChart = new Chart({ container: sourceChartRef.value, autoFit: true, height: 220 })
  sourceChart.coordinate({ type: 'theta', innerRadius: 0.6 })
  sourceChart.data(MOCK_CHART_DATA.source)
  sourceChart.interval().encode('y', 'count').encode('color', 'type').transform({ type: 'stackY' }).scale('color', { range: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f'] })
  sourceChart.interaction('tooltip', { render: (e, { title, items }) => `<div style="padding:6px 8px;font-size:12px">${items.map(i => `<div>${i.name}: ${i.value}</div>`).join('')}</div>` })
  sourceChart.legend(false)
  sourceChart.render()
  const total = MOCK_CHART_DATA.source.reduce((s, d) => s + d.count, 0)
  const svg = sourceChartRef.value.querySelector('svg')
  if (svg) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    c.setAttribute('x', '50%'); c.setAttribute('y', '50%'); c.setAttribute('text-anchor', 'middle'); c.setAttribute('dominant-baseline', 'middle')
    c.setAttribute('font-size', '20'); c.setAttribute('font-weight', '700'); c.setAttribute('fill', '#333')
    c.textContent = total.toLocaleString()
    svg.appendChild(c)
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    l.setAttribute('x', '50%'); l.setAttribute('y', '56%'); l.setAttribute('text-anchor', 'middle'); l.setAttribute('dominant-baseline', 'middle')
    l.setAttribute('font-size', '12'); l.setAttribute('fill', '#999')
    l.textContent = '总数'
    svg.appendChild(l)
  }
}

function renderLevelChart() {
  if (levelChart) levelChart.destroy()
  levelChart = new Chart({ container: levelChartRef.value, autoFit: true, height: 220 })
  levelChart.data(MOCK_CHART_DATA.byLevel)
  levelChart.interval().encode('x', 'level').encode('y', 'count').encode('color', 'level').scale('color', { range: ['#ff4d4f', '#fa8c16', '#1890ff', '#faad14'] })
  levelChart.axis('x', { label: { fontSize: 11 } })
  levelChart.axis('y', { label: { fontSize: 11 } })
  levelChart.legend(false)
  levelChart.interaction('tooltip', { shared: true })
  levelChart.render()
}

function renderResourceChart() {
  if (resourceChart) resourceChart.destroy()
  resourceChart = new Chart({ container: resourceChartRef.value, autoFit: true, height: 220 })
  resourceChart.coordinate({ transform: [{ type: 'transpose' }] })
  resourceChart.data(MOCK_CHART_DATA.byResource)
  resourceChart.interval().encode('x', 'name').encode('y', 'count').encode('color', 'name').scale('color', { range: ['#1890ff'] })
  resourceChart.axis('x', { label: { fontSize: 10 } })
  resourceChart.axis('y', { label: { fontSize: 11 } })
  resourceChart.legend(false)
  resourceChart.interaction('tooltip', { shared: true })
  resourceChart.render()
}

function renderRulesChart() {
  if (rulesChart) rulesChart.destroy()
  rulesChart = new Chart({ container: rulesChartRef.value, autoFit: true, height: 220 })
  rulesChart.coordinate({ transform: [{ type: 'transpose' }] })
  rulesChart.data(MOCK_CHART_DATA.topRules)
  rulesChart.interval().encode('x', 'name').encode('y', 'count').encode('color', 'name').scale('color', { range: ['#1890ff'] })
  rulesChart.axis('x', { label: { fontSize: 10 } })
  rulesChart.axis('y', { label: { fontSize: 11 } })
  rulesChart.legend(false)
  rulesChart.interaction('tooltip', { shared: true })
  rulesChart.render()
}

onMounted(() => {
  setTimeout(() => {
    renderTrendChart()
    renderSourceChart()
    renderLevelChart()
    renderResourceChart()
    renderRulesChart()
  }, 100)
})

onUnmounted(() => {
  if (trendChart) trendChart.destroy()
  if (sourceChart) sourceChart.destroy()
  if (levelChart) levelChart.destroy()
  if (resourceChart) resourceChart.destroy()
  if (rulesChart) rulesChart.destroy()
})
</script>

<style scoped>
.breadcrumb { font-size: 12px; color: #999; margin-bottom: 16px; }
.breadcrumb span { color: #999; }
.breadcrumb span:last-child { color: #333; font-weight: 500; }
.stat-cards { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.stat-card { flex: 1; min-width: 160px; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
.stat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.stat-icon-total { background: #e6f7ff; color: #1890ff; }
.stat-icon-critical { background: #fff2f0; color: #ff4d4f; }
.stat-icon-major { background: #fff7e6; color: #fa8c16; }
.stat-icon-minor { background: #e6f7ff; color: #1890ff; }
.stat-icon-warning { background: #fffbe6; color: #faad14; }
.stat-info { flex: 1; min-width: 0; }
.stat-label { font-size: 12px; color: #666; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; color: #333; line-height: 1.2; }
.stat-value-critical { color: #ff4d4f; }
.stat-value-major { color: #fa8c16; }
.stat-value-minor { color: #1890ff; }
.stat-value-warning { color: #faad14; }
.stat-trend { font-size: 11px; margin-top: 4px; }
.trend-up { color: #52c41a; }
.trend-down { color: #ff4d4f; }
.chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px; }
.chart-card-wide { grid-column: 1 / -1; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.chart-title { font-size: 13px; font-weight: 600; color: #333; }
.chart-body { width: 100%; }
</style>