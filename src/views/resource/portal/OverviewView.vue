<template>
  <div>
    <div class="page-header"><h3>资源概览</h3></div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header"><i class="fa-solid fa-server"></i> 资产统计</div>
        <div class="stat-card-body">
          <div class="stat-number">{{ assetStats.total.toLocaleString() }}</div>
          <div class="stat-detail">
            <span>物理机 <b>{{ assetStats.physical }}</b></span>
            <span>云VM <b>{{ assetStats.cloudVM }}</b></span>
            <span>K8s <b>{{ assetStats.k8s }}</b></span>
          </div>
        </div>
        <div class="stat-card-footer">
          <a-progress :percent="assetStats.runRate" :stroke-color="'#52c41a'" :show-info="false" size="small" />
          <span class="stat-footer-text">运行率 {{ assetStats.runRate }}% · 运行 {{ assetStats.running }} / 关机 {{ assetStats.stopped }} / 异常 {{ assetStats.abnormal }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header"><i class="fa-solid fa-location-dot"></i> 位置分布</div>
        <div class="stat-card-body">
          <div class="stat-number">{{ locationStats.total }}</div>
          <div class="stat-detail">
            <span>IDC <b>{{ locationStats.idc }}</b></span>
            <span>云Region <b>{{ locationStats.cloudRegion }}</b></span>
            <span>告警站点 <b>{{ locationStats.alertSites }}</b></span>
          </div>
        </div>
        <div class="stat-card-footer">
          <a-progress :percent="locationStats.idcNormalRate" :stroke-color="'#1890ff'" :show-info="false" size="small" />
          <span class="stat-footer-text">IDC正常率 · 平均负载 {{ locationStats.avgLoad }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header"><i class="fa-solid fa-shield-halved"></i> 合规度</div>
        <div class="stat-card-body">
          <div class="stat-number" :class="complianceColor">{{ complianceStats.score }}</div>
          <div class="stat-detail">
            <span>极高/高风险 <b>{{ complianceStats.highRisk }}</b></span>
            <span>中风险 <b>{{ complianceStats.midRisk }}</b></span>
            <span>低风险 <b>{{ complianceStats.lowRisk }}</b></span>
          </div>
        </div>
        <div class="stat-card-footer">
          <a-progress :percent="complianceStats.autoFixRate" :stroke-color="'#52c41a'" :show-info="false" size="small" />
          <span class="stat-footer-text">自动修正率 {{ complianceStats.autoFixRate }}% · 违规 {{ complianceStats.violations }} · 已修复 {{ complianceStats.fixed }}</span>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">30天资源趋势</div>
      <div class="trend-chart" ref="trendChartRef"></div>
    </div>

    <div class="section-card">
      <div class="section-title">多云 / IDC 位置分布</div>
      <div class="geo-grid">
        <div v-for="tile in geoTiles" :key="tile.name" class="geo-tile" :class="tile.type">
          <div class="geo-icon"><i :class="tile.type === 'idc' ? 'fa-solid fa-building' : 'fa-solid fa-cloud'"></i></div>
          <div class="geo-info">
            <div class="geo-name">{{ tile.name }}</div>
            <div v-if="tile.type === 'idc'" class="geo-detail">{{ tile.servers }}台 · {{ tile.racks }}机架 · {{ tile.temp }}℃</div>
            <div v-else class="geo-detail">{{ tile.resources }}资源</div>
          </div>
          <div v-if="tile.type === 'idc'" class="geo-load">
            <a-progress type="circle" :percent="tile.load" :stroke-color="tile.load > 80 ? '#f5222d' : '#1890ff'" :width="44" :stroke-width="4" :show-info="false" />
          </div>
          <div v-else class="geo-tags">
            <a-tag :color="vendorColor(tile.vendor)">{{ tile.vendor }}</a-tag>
            <a-tag :color="tile.status === '正常' ? 'success' : 'warning'">{{ tile.status }}</a-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const trendChartRef = ref(null)
let chart = null

const assetStats = ref({ total: 2847, physical: 156, cloudVM: 1823, k8s: 42, running: 2680, stopped: 142, abnormal: 25, runRate: 94.1 })
const locationStats = ref({ total: 12, idc: 5, cloudRegion: 7, alertSites: 2, idcNormalRate: 96.5, avgLoad: 62 })
const complianceStats = ref({ score: 87, highRisk: 3, midRisk: 12, lowRisk: 45, autoFixRate: 72, violations: 60, fixed: 43 })

const complianceColor = computed(() => {
  const s = complianceStats.value.score
  if (s >= 90) return 'score-green'
  if (s >= 70) return 'score-orange'
  return 'score-red'
})

const trend30d = []
for (let i = 1; i <= 30; i++) {
  const d = String(i).padStart(2, '0')
  trend30d.push({ date: `06-${d}`, type: '物理资源', count: 150 + Math.floor(Math.random() * 10) })
  trend30d.push({ date: `06-${d}`, type: '云资源', count: 1800 + Math.floor(Math.random() * 50) })
}

const geoTiles = ref([
  { name: '北京IDC-1', type: 'idc', servers: 80, racks: 12, temp: 24, load: 65 },
  { name: '上海IDC-1', type: 'idc', servers: 120, racks: 18, temp: 23, load: 78 },
  { name: '广州IDC-1', type: 'idc', servers: 60, racks: 8, temp: 26, load: 45 },
  { name: '华北区域一', type: 'cloud', vendor: '华为云', resources: 456, status: '正常' },
  { name: '美东区域一', type: 'cloud', vendor: 'AWS', resources: 234, status: '正常' },
  { name: '新加坡区域', type: 'cloud', vendor: '阿里云', resources: 189, status: '异常' },
])

const vendorColor = (v) => ({ '华为云': 'blue', 'AWS': 'orange', '阿里云': 'red' }[v] || 'default')

function renderChart() {
  if (!trendChartRef.value) return
  if (chart) { chart.destroy(); chart = null }
  chart = new Chart({ container: trendChartRef.value, autoFit: true, height: 260, padding: [20, 20, 40, 50] })
  chart.data(trend30d)
  chart.area().encode('x', 'date').encode('y', 'count').encode('color', 'type')
    .style('fillOpacity', 0.15).style('shape', 'smooth')
  chart.line().encode('x', 'date').encode('y', 'count').encode('color', 'type')
    .style('lineWidth', 2).style('shape', 'smooth')
  chart.point().encode('x', 'date').encode('y', 'count').encode('color', 'type')
    .style('r', 2)
  chart.scale('color', { range: ['#1890ff', '#52c41a'] })
  chart.legend('color', { position: 'top' })
  chart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  chart.render()
}

onMounted(() => { nextTick(() => renderChart()) })
onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null } })
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px; }
.stat-card-header { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.stat-card-header i { color: var(--brand); }
.stat-card-body { margin-bottom: 16px; }
.stat-number { font-size: 32px; font-weight: 700; color: var(--text); line-height: 1.2; }
.stat-number.score-green { color: #52c41a; }
.stat-number.score-orange { color: #fa8c16; }
.stat-number.score-red { color: #f5222d; }
.stat-detail { display: flex; gap: 16px; font-size: 12px; color: var(--text-sec); margin-top: 8px; }
.stat-detail b { color: var(--text); font-weight: 600; }
.stat-card-footer { border-top: 1px solid var(--border); padding-top: 12px; }
.stat-footer-text { font-size: 11px; color: var(--text-ter); margin-top: 4px; display: block; }

.section-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px; margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
.trend-chart { width: 100%; min-height: 260px; }

.geo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.geo-tile { background: var(--bg-sec); border: 1px solid var(--border); border-radius: var(--rl); padding: 16px; display: flex; align-items: center; gap: 12px; }
.geo-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.geo-tile.idc .geo-icon { background: #e6f7ff; color: #1890ff; }
.geo-tile.cloud .geo-icon { background: #f6ffed; color: #52c41a; }
.geo-info { flex: 1; min-width: 0; }
.geo-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.geo-detail { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
.geo-tags { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .geo-grid { grid-template-columns: 1fr; }
}
</style>
