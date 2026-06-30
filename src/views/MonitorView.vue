<template>
  <div class="obs-dashboard">
    <div class="page-header">
      <div class="header-left">
        <h2>OBS 对象存储监控</h2>
        <span class="header-badge">集群健康</span>
      </div>
      <div class="header-right">
        <div class="time-pills">
          <button class="time-pill" :class="{ active: period === '1h' }" @click="period = '1h'">1h</button>
          <button class="time-pill" :class="{ active: period === '6h' }" @click="period = '6h'">6h</button>
          <button class="time-pill" :class="{ active: period === '24h' }" @click="period = '24h'">24h</button>
          <button class="time-pill" :class="{ active: period === '7d' }" @click="period = '7d'">7d</button>
        </div>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card summary-card" v-for="s in summaryCards" :key="s.label">
        <div class="summary-icon" :style="{ background: s.bg }"><i :class="s.icon"></i></div>
        <div class="summary-info">
          <div class="summary-value" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="summary-label">{{ s.label }}</div>
          <div v-if="s.change" class="summary-change">{{ s.change }}</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="card chart-card-large">
        <div class="card-header"><h3>IOPS</h3><span class="card-extra">读 524 · 写 5,435 · 恢复 0</span></div>
        <div ref="iopsRef" class="chart-container"></div>
      </div>
      <div class="card chart-card-large">
        <div class="card-header"><h3>带宽</h3><span class="card-extra">读 530 KB/s · 写 2.57 GB/s</span></div>
        <div ref="bandwidthRef" class="chart-container"></div>
      </div>
      <div class="card chart-card-large">
        <div class="card-header"><h3>延迟</h3><span class="card-extra">读 350 μs · 写 9.99 ms</span></div>
        <div ref="latencyRef" class="chart-container"></div>
      </div>
    </div>

    <div class="mid-row">
      <div class="card chart-card-medium">
        <div class="card-header"><h3>数据健康</h3></div>
        <div class="donut-wrapper">
          <div ref="healthDonutRef" class="donut-container"></div>
          <div class="donut-legend">
            <div v-for="item in healthLegend" :key="item.label" class="legend-item">
              <span class="legend-dot" :style="{ background: item.color }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card chart-card-medium">
        <div class="card-header"><h3>健康状态</h3></div>
        <div class="health-status-body">
          <div class="health-big">
            <div class="health-count error">0</div>
            <div class="health-label">错误</div>
          </div>
          <div class="health-big">
            <div class="health-count warn">3</div>
            <div class="health-label">警告</div>
          </div>
          <div class="health-servers">
            <div class="server-stat"><span class="dot-green"></span> 9 服务器</div>
            <div class="server-stat"><span class="dot-red"></span> 0 故障</div>
            <div class="server-stat"><span class="dot-orange"></span> 3 告警</div>
          </div>
        </div>
      </div>
      <div class="card chart-card-medium">
        <div class="card-header"><h3>容量分配</h3><span class="card-extra">裸容量 144.09 TB</span></div>
        <div ref="capacityRef" class="chart-container"></div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="card alerts-card">
        <div class="card-header"><h3>告警</h3><a href="javascript:;" class="more-link">更多 &gt;</a></div>
        <div class="alerts-summary">
          <span class="alert-badge emergency">90 紧急</span>
          <span class="alert-badge error">864 错误</span>
        </div>
        <div class="alerts-list">
          <div v-for="(a, i) in alerts" :key="i" class="alert-item">
            <span class="alert-level" :class="a.level">{{ a.level === 'error' ? '错误' : '警告' }}</span>
            <span class="alert-msg">{{ a.message }}</span>
            <span class="alert-time">{{ a.time }}</span>
          </div>
        </div>
      </div>
      <div class="card top-buckets-card">
        <div class="card-header"><h3>Top 存储桶</h3></div>
        <a-table
          :columns="bucketColumns"
          :data-source="topBuckets"
          :pagination="false"
          size="small"
          row-key="name"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'usage'">
              <div class="usage-bar-wrap">
                <div class="usage-bar" :style="{ width: record.usagePercent + '%', background: getBarColor(record.usagePercent) }"></div>
              </div>
              <span class="usage-text">{{ record.usage }}</span>
            </template>
          </template>
        </a-table>
      </div>
      <div class="card storage-pool-card">
        <div class="card-header"><h3>存储池容量</h3></div>
        <div ref="poolUsageRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const period = ref('24h')

const summaryCards = [
  { label: '存储桶总数', value: '24', icon: 'fa-solid fa-bucket', bg: 'linear-gradient(135deg, #1890ff, #096dd9)', color: '#1890ff', change: '+2 今日' },
  { label: '总存储容量', value: '144.09 TB', icon: 'fa-solid fa-database', bg: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#52c41a', change: '已用 11.68 TB' },
  { label: '集群健康率', value: '100%', icon: 'fa-solid fa-heart-pulse', bg: 'linear-gradient(135deg, #13c2c2, #08979c)', color: '#13c2c2', change: '0 故障' },
  { label: '活跃告警', value: '954', icon: 'fa-solid fa-bell', bg: 'linear-gradient(135deg, #f5222d, #cf1322)', color: '#f5222d', change: '+12 较昨日' },
]

const healthLegend = [
  { label: '健康', value: '100%', color: '#52c41a' },
  { label: '降级', value: '0%', color: '#faad14' },
  { label: '恢复', value: '0%', color: '#722ed1' },
  { label: '不可用', value: '0%', color: '#f5222d' },
]

const alerts = [
  { level: 'error', message: '存储桶 "bucket02" 访问日志 日志传输组无权限', time: '12小时前' },
  { level: 'error', message: '存储桶 "bucket02" 访问日志 日志传输组无权限', time: '2天前' },
  { level: 'warn', message: '存储桶 "bucket01" 对象数 超过规格的 85%，即将达到上限', time: '2天前' },
]

const topBuckets = [
  { name: 'bucket-data-01', objects: '1,285,432', usage: '4.28 TB', usagePercent: 78 },
  { name: 'bucket-log-01', objects: '892,156', usage: '2.15 TB', usagePercent: 45 },
  { name: 'bucket-backup-01', objects: '654,321', usage: '1.87 TB', usagePercent: 38 },
  { name: 'bucket-media-01', objects: '456,789', usage: '1.24 TB', usagePercent: 26 },
  { name: 'bucket-archive-01', objects: '234,567', usage: '0.89 TB', usagePercent: 18 },
]

const bucketColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '对象数', dataIndex: 'objects', key: 'objects', width: 100, align: 'right' },
  { title: '使用量', dataIndex: 'usage', key: 'usage', width: 90, align: 'right' },
  { title: '使用率', dataIndex: 'usagePercent', key: 'usage', width: 120 },
]

function getBarColor(pct) {
  if (pct >= 80) return '#f5222d'
  if (pct >= 50) return '#fa8c16'
  return '#52c41a'
}

const iopsRef = ref(null)
const bandwidthRef = ref(null)
const latencyRef = ref(null)
const healthDonutRef = ref(null)
const capacityRef = ref(null)
const poolUsageRef = ref(null)

let iopsChart = null
let bandwidthChart = null
let latencyChart = null
let healthDonutChart = null
let capacityChart = null
let poolUsageChart = null

function generateTimeSeries(count, min, max, peakIdx) {
  const data = []
  for (let i = 0; i < count; i++) {
    let v = min + Math.random() * (max - min)
    if (i === peakIdx) v = max * 1.2
    data.push({ time: `${String(i).padStart(2, '0')}:00`, value: Math.round(v) })
  }
  return data
}

const iopsData = generateTimeSeries(12, 2000, 15000, 1)
const bandwidthData = generateTimeSeries(12, 1, 4, 1)
const latencyData = generateTimeSeries(12, 2, 12, 8)

function renderIOPSChart() {
  if (iopsChart) { iopsChart.destroy(); iopsChart = null }
  if (!iopsRef.value) return
  iopsChart = new Chart({ container: iopsRef.value, autoFit: true, padding: [8, 8, 16, 20] })
  iopsChart.area().data(iopsData).encode('x', 'time').encode('y', 'value')
    .style('fill', 'l(0) 0:#1890ff30 1:#1890ff05').style('shape', 'smooth')
  iopsChart.line().data(iopsData).encode('x', 'time').encode('y', 'value')
    .style('stroke', '#1890ff').style('lineWidth', 2).style('shape', 'smooth')
  iopsChart.point().data(iopsData).encode('x', 'time').encode('y', 'value')
    .style('fill', '#1890ff').style('stroke', '#FFF').style('lineWidth', 1.5).style('size', 3)
  iopsChart.render()
}

function renderBandwidthChart() {
  if (bandwidthChart) { bandwidthChart.destroy(); bandwidthChart = null }
  if (!bandwidthRef.value) return
  bandwidthChart = new Chart({ container: bandwidthRef.value, autoFit: true, padding: [8, 8, 16, 20] })
  bandwidthChart.area().data(bandwidthData).encode('x', 'time').encode('y', 'value')
    .style('fill', 'l(0) 0:#07C16030 1:#07C16005').style('shape', 'smooth')
  bandwidthChart.line().data(bandwidthData).encode('x', 'time').encode('y', 'value')
    .style('stroke', '#07C160').style('lineWidth', 2).style('shape', 'smooth')
  bandwidthChart.render()
}

function renderLatencyChart() {
  if (latencyChart) { latencyChart.destroy(); latencyChart = null }
  if (!latencyRef.value) return
  latencyChart = new Chart({ container: latencyRef.value, autoFit: true, padding: [8, 8, 16, 20] })
  latencyChart.area().data(latencyData).encode('x', 'time').encode('y', 'value')
    .style('fill', 'l(0) 0:#722ed130 1:#722ed105').style('shape', 'smooth')
  latencyChart.line().data(latencyData).encode('x', 'time').encode('y', 'value')
    .style('stroke', '#722ed1').style('lineWidth', 2).style('shape', 'smooth')
  latencyChart.render()
}

function renderHealthDonut() {
  if (healthDonutChart) { healthDonutChart.destroy(); healthDonutChart = null }
  if (!healthDonutRef.value) return
  healthDonutChart = new Chart({ container: healthDonutRef.value, autoFit: true, height: 180, padding: [8, 8, 8, 8] })
  healthDonutChart.coordinate({ type: 'theta', innerRadius: 0.7, outerRadius: 0.9 })
  healthDonutChart.data([
    { type: '健康', value: 100, color: '#52c41a' },
    { type: '降级', value: 0, color: '#faad14' },
    { type: '恢复', value: 0, color: '#722ed1' },
    { type: '不可用', value: 0, color: '#f5222d' },
  ])
  healthDonutChart.interval().encode('x', 'type').encode('y', 'value').encode('color', 'type')
    .scale('color', { range: ['#52c41a', '#faad14', '#722ed1', '#f5222d'] })
    .style('stroke', '#FFF').style('lineWidth', 2)
  healthDonutChart.legend(false)
  healthDonutChart.render()
}

function renderCapacityChart() {
  if (capacityChart) { capacityChart.destroy(); capacityChart = null }
  if (!capacityRef.value) return
  capacityChart = new Chart({ container: capacityRef.value, autoFit: true, height: 180, padding: [8, 16, 16, 16] })
  capacityChart.data([
    { label: '可用磁盘', value: 92.78 },
    { label: '使用磁盘', value: 11.68 },
  ])
  capacityChart.interval().encode('x', 'label').encode('y', 'value').encode('color', 'label')
    .scale('color', { range: ['#1890ff', '#faad14'] })
    .style('radius', [4, 4, 0, 0])
  capacityChart.legend(false)
  capacityChart.render()
}

function renderPoolUsage() {
  if (poolUsageChart) { poolUsageChart.destroy(); poolUsageChart = null }
  if (!poolUsageRef.value) return
  poolUsageChart = new Chart({ container: poolUsageRef.value, autoFit: true, height: 180, padding: [8, 16, 16, 16] })
  poolUsageChart.data([
    { name: 'obsData', value: 22.58 },
    { name: 'test_ec', value: 6.5 },
    { name: 'obsIndex', value: 0.096 },
  ])
  poolUsageChart.interval().encode('x', 'name').encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#722ed1', '#1890ff', '#d9d9d9'] })
    .style('radius', [4, 4, 0, 0])
  poolUsageChart.legend(false)
  poolUsageChart.render()
}

function renderAllCharts() {
  renderIOPSChart()
  renderBandwidthChart()
  renderLatencyChart()
  renderHealthDonut()
  renderCapacityChart()
  renderPoolUsage()
}

onMounted(() => {
  nextTick(() => renderAllCharts())
})

onBeforeUnmount(() => {
  if (iopsChart) { iopsChart.destroy(); iopsChart = null }
  if (bandwidthChart) { bandwidthChart.destroy(); bandwidthChart = null }
  if (latencyChart) { latencyChart.destroy(); latencyChart = null }
  if (healthDonutChart) { healthDonutChart.destroy(); healthDonutChart = null }
  if (capacityChart) { capacityChart.destroy(); capacityChart = null }
  if (poolUsageChart) { poolUsageChart.destroy(); poolUsageChart = null }
})
</script>

<style scoped>
.obs-dashboard {
  padding: 0 24px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  background: #f5f7fa;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.header-badge {
  font-size: 11px;
  font-weight: 600;
  color: #52c41a;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  padding: 2px 10px;
  border-radius: 10px;
}
.header-right { display: flex; align-items: center; gap: 12px; }
.time-pills {
  display: flex;
  gap: 2px;
  background: #fff;
  border-radius: 20px;
  padding: 2px;
  border: 1px solid #e8e8e8;
}
.time-pill {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.15s;
}
.time-pill:hover { color: #1a1a1a; }
.time-pill.active { background: #1890ff; color: #fff; }

.summary-cards {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.summary-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.summary-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary-icon i { font-size: 24px; color: #fff; }
.summary-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.summary-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 2px;
}
.summary-change {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 4px;
}

.chart-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.chart-card-large { flex: 1; min-height: 0; }
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.card-extra {
  font-size: 11px;
  color: #8c8c8c;
}
.chart-container {
  width: 100%;
  height: 180px;
}

.mid-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.chart-card-medium { flex: 1; }

.donut-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.donut-container {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  font-size: 12px;
  color: #595959;
  min-width: 48px;
}
.legend-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.health-status-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 12px 0;
}
.health-big { text-align: center; }
.health-count {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}
.health-count.error { color: #f5222d; }
.health-count.warn { color: #fa8c16; }
.health-label { font-size: 12px; color: #8c8c8c; margin-top: 4px; }
.health-servers {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
  border-left: 1px solid #f0f0f0;
}
.server-stat {
  font-size: 13px;
  color: #595959;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot-green { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #52c41a; }
.dot-red { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f5222d; }
.dot-orange { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #fa8c16; }

.bottom-row {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.alerts-card { flex: 1.2; display: flex; flex-direction: column; }
.top-buckets-card { flex: 1.4; display: flex; flex-direction: column; }
.storage-pool-card { flex: 1; display: flex; flex-direction: column; }

.more-link {
  font-size: 12px;
  color: #1890ff;
  text-decoration: none;
}
.alerts-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.alert-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
}
.alert-badge.emergency { background: #fff1f0; color: #f5222d; }
.alert-badge.error { background: #fff1f0; color: #f5222d; }
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  padding: 8px;
  border-radius: 6px;
  background: #fafafa;
}
.alert-level {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 1px;
}
.alert-level.error { background: #f5222d; color: #fff; }
.alert-level.warn { background: #fa8c16; color: #fff; }
.alert-msg {
  color: #1a1a1a;
  flex: 1;
  line-height: 1.4;
}
.alert-time {
  color: #8c8c8c;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.usage-bar-wrap) {
  display: flex;
  align-items: center;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  width: 60px;
}
.usage-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.usage-text {
  margin-left: 6px;
  font-size: 12px;
  color: #595959;
}

@media (max-width: 1024px) {
  .chart-row { flex-direction: column; }
  .mid-row { flex-direction: column; }
  .bottom-row { flex-direction: column; }
  .summary-cards { flex-wrap: wrap; }
  .summary-card { min-width: calc(50% - 8px); }
}
@media (max-width: 768px) {
  .obs-dashboard { padding: 0 12px 12px; }
  .header-left h2 { font-size: 16px; }
  .summary-card { min-width: 100%; }
  .donut-wrapper { flex-direction: column; }
  .health-status-body { flex-direction: column; }
}
</style>
