<template>
  <div class="obs-dashboard">
    <div class="obs-toolbar">
      <div class="obs-toolbar-left">
        <div class="time-pills">
          <button class="time-pill" :class="{ active: period === '1h' }" @click="period = '1h'">1h</button>
          <button class="time-pill" :class="{ active: period === '6h' }" @click="period = '6h'">6h</button>
          <button class="time-pill" :class="{ active: period === '24h' }" @click="period = '24h'">24h</button>
          <button class="time-pill" :class="{ active: period === '7d' }" @click="period = '7d'">7d</button>
          <button class="time-pill" :class="{ active: period === '30d' }" @click="period = '30d'">30d</button>
        </div>
      </div>
      <div class="obs-toolbar-right">
        <a-dropdown :trigger="['click']" class="refresh-dropdown">
          <button class="header-btn refresh-btn">
            <i class="fa-solid fa-rotate"></i>
            <span>{{ refreshRate === '0' ? '自动刷新' : refreshOptions.find(r => r.value === refreshRate)?.label }}</span>
          </button>
          <template #overlay>
            <a-menu>
              <a-menu-item v-for="opt in refreshOptions" :key="opt.value" @click="setRefreshRate(opt.value)">
                {{ opt.label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <span v-if="lastRefresh" class="last-refresh">最后更新: {{ lastRefresh }}</span>
      </div>
    </div>

    <div class="obs-row summary-row">
      <div class="obs-card" v-for="s in summaryCards" :key="s.label">
        <div class="obs-card-icon" :style="{ background: s.bg }"><i :class="s.icon"></i></div>
        <div class="obs-card-body">
          <div class="obs-card-value" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="obs-card-label">{{ s.label }}</div>
          <div v-if="s.change" class="obs-card-change">{{ s.change }}</div>
        </div>
      </div>
    </div>

    <div class="obs-row">
      <div class="obs-card">
        <div class="card-hdr"><span>IOPS</span><span class="card-extra">读 524 · 写 5,435</span></div>
        <div ref="iopsRef" class="chart-box"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>带宽</span><span class="card-extra">读 530 KB/s · 写 2.57 GB/s</span></div>
        <div ref="bandwidthRef" class="chart-box"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>延迟</span><span class="card-extra">读 350 μs · 写 9.99 ms</span></div>
        <div ref="latencyRef" class="chart-box"></div>
      </div>
    </div>

    <div class="obs-row">
      <div class="obs-card">
        <div class="card-hdr"><span>数据健康</span></div>
        <div ref="healthRef" class="chart-box"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>监控状态</span></div>
        <div ref="statusRef" class="chart-box"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>容量分配</span><span class="card-extra">裸容量 144.09 TB</span></div>
        <div ref="capacityRef" class="chart-box"></div>
      </div>
    </div>

    <div class="obs-row obs-row-bottom">
      <div class="obs-card">
        <div class="card-hdr"><span>存储池容量</span></div>
        <div ref="poolRef" class="chart-box fill"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>Top 存储桶</span></div>
        <div ref="topBucketsRef" class="chart-box fill"></div>
      </div>
      <div class="obs-card">
        <div class="card-hdr"><span>告警</span></div>
        <div class="alert-table-wrap fill">
          <table class="alert-table">
            <thead>
              <tr><th>告警名称</th><th>告警级别</th><th>告警源</th><th>发生时间</th></tr>
            </thead>
            <tbody>
              <tr v-for="a in alerts" :key="a.id">
                <td class="al-name" :title="a.name">{{ a.name }}</td>
                <td><span class="al-tag" :class="a.level">{{ a.level === 'error' ? '错误' : '警告' }}</span></td>
                <td>{{ a.source }}</td>
                <td class="al-time">{{ a.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const period = ref('24h')
const refreshRate = ref('0')
const lastRefresh = ref('')

const refreshOptions = [
  { value: '0', label: '关闭' },
  { value: '30', label: '30秒' },
  { value: '60', label: '1分钟' },
  { value: '300', label: '5分钟' },
  { value: '900', label: '15分钟' },
  { value: '1800', label: '30分钟' },
]

let refreshTimer = null

function setRefreshRate(rate) {
  refreshRate.value = rate
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (rate !== '0') {
    refreshTimer = setInterval(() => {
      lastRefresh.value = new Date().toLocaleString()
      renderAll()
    }, parseInt(rate) * 1000)
  }
}

import { Chart } from '@antv/g2'

const summaryCards = [
  { label: '存储桶总数', value: '24', icon: 'fa-solid fa-bucket', bg: 'linear-gradient(135deg, #1890ff, #096dd9)', color: '#1890ff', change: '+2 今日' },
  { label: '总存储容量', value: '144.09 TB', icon: 'fa-solid fa-database', bg: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#52c41a', change: '已用 11.68 TB' },
  { label: '集群健康率', value: '100%', icon: 'fa-solid fa-heart-pulse', bg: 'linear-gradient(135deg, #13c2c2, #08979c)', color: '#13c2c2', change: '0 故障' },
  { label: '活跃告警', value: '954', icon: 'fa-solid fa-bell', bg: 'linear-gradient(135deg, #f5222d, #cf1322)', color: '#f5222d', change: '+12 较昨日' },
]

const alerts = [
  { id: 1, name: '存储桶 bucket02 访问日志传输组无权限', level: 'error', source: 'obs-prod-01', time: '2026-06-29 10:23' },
  { id: 2, name: '存储桶 bucket01 对象数超规格 85%', level: 'warn', source: 'obs-prod-01', time: '2026-06-28 15:47' },
  { id: 3, name: '存储桶 bucket02 访问日志传输组无权限', level: 'error', source: 'obs-prod-01', time: '2026-06-27 08:12' },
  { id: 4, name: '存储池 obsData 容量使用率超过 70%', level: 'warn', source: 'obs-prod-01', time: '2026-06-26 22:05' },
  { id: 5, name: '节点 HN05 磁盘 I/O 延迟过高', level: 'warn', source: 'node-hn05', time: '2026-06-26 14:33' },
]

const iopsRef = ref(null)
const bandwidthRef = ref(null)
const latencyRef = ref(null)
const healthRef = ref(null)
const statusRef = ref(null)
const capacityRef = ref(null)
const poolRef = ref(null)
const topBucketsRef = ref(null)

let iopsChart = null
let bandwidthChart = null
let latencyChart = null
let healthChart = null
let statusChart = null
let capacityChart = null
let poolChart = null
let topBucketsChart = null

function genTS(n, min, max) {
  return Array.from({ length: n }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    value: Math.round(min + Math.random() * (max - min))
  }))
}

const iopsData = genTS(12, 2000, 15000)
const bwData = genTS(12, 1, 4)
const latData = genTS(12, 2, 12)

function renderIOPS() {
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

function renderBandwidth() {
  if (bandwidthChart) { bandwidthChart.destroy(); bandwidthChart = null }
  if (!bandwidthRef.value) return
  bandwidthChart = new Chart({ container: bandwidthRef.value, autoFit: true, padding: [8, 8, 16, 20] })
  bandwidthChart.area().data(bwData).encode('x', 'time').encode('y', 'value')
    .style('fill', 'l(0) 0:#07C16030 1:#07C16005').style('shape', 'smooth')
  bandwidthChart.line().data(bwData).encode('x', 'time').encode('y', 'value')
    .style('stroke', '#07C160').style('lineWidth', 2).style('shape', 'smooth')
  bandwidthChart.render()
}

function renderLatency() {
  if (latencyChart) { latencyChart.destroy(); latencyChart = null }
  if (!latencyRef.value) return
  latencyChart = new Chart({ container: latencyRef.value, autoFit: true, padding: [8, 8, 16, 20] })
  latencyChart.area().data(latData).encode('x', 'time').encode('y', 'value')
    .style('fill', 'l(0) 0:#722ed130 1:#722ed105').style('shape', 'smooth')
  latencyChart.line().data(latData).encode('x', 'time').encode('y', 'value')
    .style('stroke', '#722ed1').style('lineWidth', 2).style('shape', 'smooth')
  latencyChart.render()
}

function renderHealth() {
  if (healthChart) { healthChart.destroy(); healthChart = null }
  if (!healthRef.value) return
  healthChart = new Chart({ container: healthRef.value, autoFit: true, height: 180, padding: [4, 4, 4, 4] })
  healthChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  healthChart.data([
    { name: '健康', value: 85 },
    { name: '降级', value: 10 },
    { name: '恢复', value: 3 },
    { name: '不可用', value: 2 },
  ])
  healthChart.interval().encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#52c41a', '#faad14', '#722ed1', '#f5222d'] })
    .style('stroke', '#fff').style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '占比', valueFormatter: (v) => v + '%' }] })
  healthChart.label({
    text: (d) => `${d.name}\n${d.value}%`,
    position: 'outside',
    connector: true,
    connectorStroke: '#ccc',
    connectorLineWidth: 1,
    fontSize: 11,
    labelLine: true,
  })
  healthChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })
  healthChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  healthChart.render()
}

function renderStatus() {
  if (statusChart) { statusChart.destroy(); statusChart = null }
  if (!statusRef.value) return
  statusChart = new Chart({ container: statusRef.value, autoFit: true, height: 180, padding: [4, 4, 4, 4] })
  statusChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  statusChart.data([
    { name: '正常', value: 14 },
    { name: '告警', value: 3 },
  ])
  statusChart.interval().encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#52c41a', '#fa8c16'] })
    .style('stroke', '#fff').style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '节点数', valueFormatter: (v) => v.toLocaleString() }] })
  statusChart.label({
    text: (d) => `${d.name}\n${d.value}`,
    position: 'outside',
    connector: true,
    connectorStroke: '#ccc',
    connectorLineWidth: 1,
    fontSize: 11,
    labelLine: true,
  })
  statusChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })
  statusChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  statusChart.render()
}

function renderCapacity() {
  if (capacityChart) { capacityChart.destroy(); capacityChart = null }
  if (!capacityRef.value) return
  capacityChart = new Chart({ container: capacityRef.value, autoFit: true, padding: [8, 16, 16, 16] })
  capacityChart.interval()
    .data([
      { name: '可用容量', value: 92.78 },
      { name: '已使用容量', value: 11.68 },
    ])
    .encode('x', 'name').encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#1890ff', '#faad14'] })
    .style('radius', [2, 2, 0, 0])
    .legend(false)
  capacityChart.render()
}

function renderPool() {
  if (poolChart) { poolChart.destroy(); poolChart = null }
  if (!poolRef.value) return
  poolChart = new Chart({ container: poolRef.value, autoFit: true, padding: [8, 16, 16, 16] })
  poolChart.interval()
    .data([
      { name: 'obsData', value: 22.58 },
      { name: 'backupPool', value: 12.30 },
      { name: 'test_ec', value: 6.50 },
      { name: 'cachePool', value: 4.20 },
      { name: 'obsIndex', value: 0.10 },
    ])
    .encode('x', 'name').encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#722ed1', '#13c2c2', '#1890ff', '#fa8c16', '#d9d9d9'] })
    .style('radius', [2, 2, 0, 0])
    .legend(false)
  poolChart.render()
}

function renderTopBuckets() {
  if (topBucketsChart) { topBucketsChart.destroy(); topBucketsChart = null }
  if (!topBucketsRef.value) return
  topBucketsChart = new Chart({ container: topBucketsRef.value, autoFit: true, padding: [8, 40, 16, 60] })
  topBucketsChart.coordinate({ transform: [{ type: 'transpose' }] })
  topBucketsChart.interval()
    .data([
      { name: 'bucket-data-01', value: 78 },
      { name: 'bucket-log-01', value: 45 },
      { name: 'bucket-backup-01', value: 38 },
      { name: 'bucket-media-01', value: 26 },
      { name: 'bucket-archive-01', value: 18 },
    ])
    .encode('x', 'name').encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#f5222d', '#fa8c16', '#faad14', '#1890ff', '#52c41a'] })
    .style('radius', [0, 2, 2, 0])
    .axis('y', { labelFormatter: (v) => v + '%' })
    .legend(false)
  topBucketsChart.render()
}

function renderAll() {
  renderIOPS()
  renderBandwidth()
  renderLatency()
  renderHealth()
  renderStatus()
  renderCapacity()
  renderPool()
  renderTopBuckets()
}

onMounted(() => {
  lastRefresh.value = new Date().toLocaleString()
  nextTick(() => renderAll())
})

onBeforeUnmount(() => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  const charts = [iopsChart, bandwidthChart, latencyChart, healthChart, statusChart, capacityChart, poolChart, topBucketsChart]
  charts.forEach((c) => { if (c) c.destroy() })
})
</script>

<style scoped>
.obs-dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 12px;
}
.obs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 4px;
}
.obs-toolbar-left { display: flex; align-items: center; gap: 10px; }
.obs-toolbar-right { display: flex; align-items: center; gap: 8px; }
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
.last-refresh { font-size: 11px; color: #8c8c8c; }

.obs-row {
  display: flex;
  gap: 16px;
}
.obs-row > .obs-card { flex: 1; min-width: 0; }
.obs-row-bottom > .obs-card { display: flex; flex-direction: column; }
.obs-row-bottom .chart-box.fill,
.obs-row-bottom .alert-table-wrap.fill { flex: 1; min-height: 0; }

.obs-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.summary-row .obs-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
.obs-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.obs-card-icon i { font-size: 22px; color: #fff; }
.obs-card-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.obs-card-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 2px;
}
.obs-card-change {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 3px;
}

.card-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.card-extra {
  font-size: 10px;
  font-weight: 400;
  color: #8c8c8c;
}
.chart-box { width: 100%; height: 180px; min-height: 0; }

.alert-table-wrap { overflow-y: auto; }
.alert-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.alert-table th {
  text-align: left;
  padding: 4px 8px;
  font-weight: 600;
  color: #8c8c8c;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
.alert-table td { padding: 5px 8px; border-bottom: 1px solid #f5f5f5; color: #1a1a1a; }
.alert-table tbody tr:hover { background: #fafafa; }
.al-name { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al-time { white-space: nowrap; }
.al-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}
.al-tag.error { background: #f5222d; color: #fff; }
.al-tag.warn { background: #fa8c16; color: #fff; }

@media (max-width: 768px) {
  .obs-row { flex-direction: column; }
  .summary-row { flex-direction: row; flex-wrap: wrap; }
  .summary-row .obs-card { width: calc(50% - 8px); flex: none; min-width: 0; padding: 14px 16px; }
  .obs-card { padding: 14px 16px; }
  .obs-card-icon { width: 44px; height: 44px; }
  .obs-card-icon i { font-size: 18px; }
  .obs-card-value { font-size: 22px; }
  .obs-toolbar { flex-direction: column; align-items: flex-start; gap: 8px; }
  .alert-table-wrap { overflow-x: auto; }
  .chart-box { height: 160px; }
}
@media (max-width: 420px) {
  .summary-row .obs-card { width: 100%; }
}
</style>
