<template>
  <div class="bd-dashboard">
    <div class="bd-toolbar">
      <div class="bd-toolbar-left">
        <div class="bd-time-pills">
          <button class="bd-time-pill" :class="{ active: period === '1h' }" @click="period = '1h'">1h</button>
          <button class="bd-time-pill" :class="{ active: period === '6h' }" @click="period = '6h'">6h</button>
          <button class="bd-time-pill" :class="{ active: period === '24h' }" @click="period = '24h'">24h</button>
          <button class="bd-time-pill" :class="{ active: period === '7d' }" @click="period = '7d'">7d</button>
          <button class="bd-time-pill" :class="{ active: period === '30d' }" @click="period = '30d'">30d</button>
        </div>
      </div>
      <div class="bd-toolbar-right">
        <a-dropdown :trigger="['click']" class="refresh-dropdown">
          <button class="bd-header-btn bd-refresh-btn">
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
        <span v-if="lastRefresh" class="bd-last-refresh">最后更新: {{ lastRefresh }}</span>
      </div>
    </div>

    <div class="bd-summary">
      <div class="bd-summary-card" v-for="s in summaryCards" :key="s.label">
        <div class="bd-summary-icon" :style="{ background: s.bg }"><i :class="s.icon"></i></div>
        <div class="bd-summary-body">
          <div class="bd-summary-value" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="bd-summary-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="bd-section">
      <div class="bd-section-title">云服务 API 监测</div>
      <div class="bd-stats-row">
        <span class="bd-stat-pill">总接口 {{ apiCards.length }}</span>
        <span v-if="apiNormalCount" class="bd-stat-pill bd-stat-ok">正常 {{ apiNormalCount }}</span>
        <span v-if="apiWarnCount" class="bd-stat-pill bd-stat-warn">偏高 {{ apiWarnCount }}</span>
        <span v-if="apiDangerCount" class="bd-stat-pill bd-stat-danger">异常 {{ apiDangerCount }}</span>
        <span class="bd-stat-pill">平均时延 {{ apiAvgLatency }}ms</span>
        <span class="bd-stat-pill">总 TPS {{ apiTotalTps.toLocaleString() }}</span>
        <span class="bd-stat-pill">总成功率 {{ apiAvgRate }}%</span>
      </div>
      <a-table :columns="apiColumns" :data-source="apiCards" :pagination="false" size="small" :row-class-name="() => 'bd-api-row'">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avgLatency'">
            <div class="bd-cell-spark-wrap">
              <span class="bd-latency" :class="getLatencyClass(record.avgLatency)">{{ record.avgLatency }}ms</span>
              <svg class="bd-cell-spark" viewBox="0 0 120 16" preserveAspectRatio="none">
                <polyline :points="computePoints(record.latencyTrend, 120, 16)" fill="none" stroke="#1890ff" stroke-width="1" stroke-linejoin="round" />
              </svg>
            </div>
          </template>
          <template v-if="column.key === 'tps'">
            <div class="bd-cell-spark-wrap">
              <span class="bd-tps">{{ record.tps.toLocaleString() }}次/秒</span>
              <svg class="bd-cell-spark" viewBox="0 0 120 16" preserveAspectRatio="none">
                <polyline :points="computePoints(record.tpsTrend, 120, 16)" fill="none" stroke="#1890ff" stroke-width="1" stroke-linejoin="round" />
              </svg>
            </div>
          </template>
          <template v-if="column.key === 'successRate'">
            <div class="bd-cell-spark-wrap">
              <span class="bd-rate-text" :class="getRateClass(record.successRate)">{{ record.successRate }}%</span>
              <svg class="bd-cell-spark" viewBox="0 0 120 16" preserveAspectRatio="none">
                <polyline :points="computePoints(record.rateTrend, 120, 16)" fill="none" stroke="#52c41a" stroke-width="1" stroke-linejoin="round" />
              </svg>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <div class="bd-section">
      <div class="bd-section-title">集群资源总览</div>
      <div class="bd-subsys-pills">
        <button :class="{ active: activeSubsystem === 'all' }" @click="activeSubsystem = 'all'">全部</button>
        <button v-for="g in filteredSubsystemGroups" :key="g.id" :class="{ active: activeSubsystem === g.id }" @click="activeSubsystem = g.id">{{ g.name }}</button>
      </div>
      <div class="bd-subsys-grid">
        <div class="bd-subsys-card" v-for="(g, sgIdx) in visibleSubsystems" :key="g.id" :id="'subsys-' + g.id">
          <div class="bd-subsys-header" @click="g.open = !g.open">
            <i :class="g.icon" class="bd-subsys-icon"></i>
            <span class="bd-subsys-name">{{ g.name }}</span>
            <span class="bd-subsys-count">{{ g.metrics.length }} 项</span>
            <i class="fa-solid fa-chevron-down bd-chevron" :class="{ rotated: !g.open }"></i>
          </div>
          <div class="bd-subsys-body" v-show="g.open">
            <div class="bd-metric-card" v-for="(m, idx) in g.metrics" :key="idx">
              <div class="bd-metric-label">{{ m.name }}</div>
              <div class="bd-metric-row">
                <span class="bd-metric-value" :class="getMetricClass(m)">{{ m.value }}</span>
                <span class="bd-metric-unit" v-if="m.unit">{{ m.unit }}</span>
              </div>
              <svg class="bd-mini-spark" viewBox="0 0 120 16" preserveAspectRatio="none">
                <polyline :points="computePoints(m.trend)" fill="none" :stroke="getSparkColor(sgIdx, idx)" stroke-width="1" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const period = ref('24h')
const refreshRate = ref('0')
const lastRefresh = ref('')
const activeSubsystem = ref('all')

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
    refreshTimer = setInterval(() => { lastRefresh.value = new Date().toLocaleString() }, parseInt(rate) * 1000)
  }
}

const summaryCards = [
  { label: '集群节点', value: '128', icon: 'fa-solid fa-server', bg: 'linear-gradient(135deg, #1890ff, #096dd9)', color: '#1890ff' },
  { label: '活跃告警', value: '7', icon: 'fa-solid fa-triangle-exclamation', bg: 'linear-gradient(135deg, #f5222d, #cf1322)', color: '#f5222d' },
  { label: '运行任务', value: '1,024', icon: 'fa-solid fa-gears', bg: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#52c41a' },
  { label: '集群健康率', value: '98.4%', icon: 'fa-solid fa-heart-pulse', bg: 'linear-gradient(135deg, #13c2c2, #08979c)', color: '#13c2c2' },
]

function genTrend(n, min, max) {
  return Array.from({ length: n }, () => Math.round(min + Math.random() * (max - min)))
}

const sparkColors = ['#1890ff', '#40a9ff', '#096dd9', '#69c0ff', '#36cfc9']
function getSparkColor(sgIdx, idx) {
  return sparkColors[(sgIdx * 3 + idx * 7) % sparkColors.length]
}

const apiCards = [
  { key: 1, name: '集群列表接口', avgLatency: 120, tps: 1234, successRate: 99.97, latencyTrend: genTrend(12, 5, 30), tpsTrend: genTrend(12, 500, 1800), rateTrend: genTrend(12, 9970, 10000) },
  { key: 2, name: '添加作业接口', avgLatency: 350, tps: 456, successRate: 99.82, latencyTrend: genTrend(12, 15, 50), tpsTrend: genTrend(12, 200, 800), rateTrend: genTrend(12, 9960, 9990) },
  { key: 3, name: '获取作业执行结果接口', avgLatency: 80, tps: 2100, successRate: 99.99, latencyTrend: genTrend(12, 3, 20), tpsTrend: genTrend(12, 1200, 2800), rateTrend: genTrend(12, 9980, 10000) },
  { key: 4, name: '查询作业列表接口', avgLatency: 150, tps: 890, successRate: 99.95, latencyTrend: genTrend(12, 8, 35), tpsTrend: genTrend(12, 400, 1400), rateTrend: genTrend(12, 9970, 10000) },
  { key: 5, name: '停止作业接口', avgLatency: 220, tps: 123, successRate: 99.90, latencyTrend: genTrend(12, 10, 40), tpsTrend: genTrend(12, 50, 300), rateTrend: genTrend(12, 9960, 9995) },
  { key: 6, name: '批量删除作业接口', avgLatency: 450, tps: 67, successRate: 99.75, latencyTrend: genTrend(12, 20, 55), tpsTrend: genTrend(12, 20, 150), rateTrend: genTrend(12, 9950, 9990) },
  { key: 7, name: '提交作业接口', avgLatency: 180, tps: 567, successRate: 99.88, latencyTrend: genTrend(12, 10, 40), tpsTrend: genTrend(12, 200, 900), rateTrend: genTrend(12, 9960, 9995) },
]

const apiColumns = [
  { title: 'API 名称', dataIndex: 'name', key: 'name', width: 170 },
  { title: '平均时延', dataIndex: 'avgLatency', key: 'avgLatency', width: 170 },
  { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 150 },
  { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 150 },
]

const apiNormalCount = computed(() => apiCards.filter(c => c.avgLatency < 150).length)
const apiWarnCount = computed(() => apiCards.filter(c => c.avgLatency >= 150 && c.avgLatency < 300).length)
const apiDangerCount = computed(() => apiCards.filter(c => c.avgLatency >= 300).length)
const apiAvgLatency = computed(() => (apiCards.reduce((s, c) => s + c.avgLatency, 0) / apiCards.length).toFixed(0))
const apiTotalTps = computed(() => apiCards.reduce((s, c) => s + c.tps, 0))
const apiAvgRate = computed(() => (apiCards.reduce((s, c) => s + c.successRate, 0) / apiCards.length).toFixed(2))

function getLatencyClass(val) {
  if (val < 150) return 'bd-latency-ok'
  if (val < 300) return 'bd-latency-warn'
  return 'bd-latency-danger'
}

function getRateClass(rate) {
  if (rate >= 99.9) return 'bd-rate-ok'
  if (rate >= 99) return 'bd-rate-warn'
  return 'bd-rate-danger'
}

function computePoints(data, w = 120, h = 24) {
  if (!data || !data.length) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pad = 1
  return data.map((v, i) => `${(i / (data.length - 1)) * (w - pad * 2) + pad},${(h - pad * 2) - ((v - min) / range) * (h - pad * 2) + pad}`).join(' ')
}

function getMetricClass(m) {
  if (m.unit === '%') {
    const v = parseFloat(m.value)
    if (v < 60) return 'bd-normal'
    if (v < 85) return 'bd-warn'
    return 'bd-danger'
  }
  if (m.isDanger) return 'bd-danger'
  if (m.isWarn) return 'bd-warn'
  return ''
}

function generateSubsystemGroups() {
  return [
    {
      id: 'host', name: 'Host', icon: 'fa-solid fa-server', open: true,
      metrics: [
        { name: '主机CPU使用率', value: '68', unit: '%', trend: genTrend(12, 30, 90) },
        { name: '主机磁盘使用率', value: '72', unit: '%', trend: genTrend(12, 50, 85) },
        { name: '主机内存使用率', value: '81', unit: '%', trend: genTrend(12, 55, 90) },
        { name: '主机网络接收速率', value: '1,256', unit: 'KB/s', trend: genTrend(12, 500, 2000) },
        { name: '主机网络发送速率', value: '892', unit: 'KB/s', trend: genTrend(12, 300, 1500) },
      ]
    },
    {
      id: 'zookeeper', name: 'ZooKeeper', icon: 'fa-solid fa-paw', open: true,
      metrics: [
        { name: '总体磁盘IO写速率', value: '45', unit: 'KB/s', trend: genTrend(12, 20, 80) },
        { name: '总体磁盘IO读速率', value: '120', unit: 'KB/s', trend: genTrend(12, 50, 200) },
        { name: '总体CPU使用率', value: '23', unit: '%', trend: genTrend(12, 10, 40) },
        { name: '总体内存使用大小', value: '512', unit: 'MB', trend: genTrend(12, 400, 700) },
      ]
    },
    {
      id: 'yarn', name: 'Yarn', icon: 'fa-solid fa-layer-group', open: true,
      metrics: [
        { name: 'Map总任务数', value: '256', unit: '', trend: genTrend(12, 200, 350) },
        { name: '执行成功的Map任务数', value: '248', unit: '', trend: genTrend(12, 180, 320) },
        { name: '正在执行的Reduce任务数', value: '12', unit: '', trend: genTrend(12, 5, 30) },
        { name: 'Reduce总任务数', value: '128', unit: '', trend: genTrend(12, 80, 200) },
        { name: '正在执行的Map任务数', value: '8', unit: '', trend: genTrend(12, 2, 20) },
        { name: 'root队列下失败的任务数', value: '3', unit: '', isDanger: true, trend: genTrend(12, 0, 10) },
        { name: 'Yarn总体CPU使用率', value: '55', unit: '%', trend: genTrend(12, 30, 75) },
        { name: 'Yarn总体内存使用大小', value: '4,096', unit: 'MB', trend: genTrend(12, 2000, 5000) },
        { name: 'Yarn总体磁盘IO读速率', value: '2,340', unit: 'KB/s', trend: genTrend(12, 1000, 4000) },
        { name: 'Yarn总体磁盘IO写速率', value: '1,120', unit: 'KB/s', trend: genTrend(12, 500, 2000) },
        { name: '正在运行的任务', value: '156', unit: '', trend: genTrend(12, 100, 250) },
        { name: '失败的任务', value: '3', unit: '', isDanger: true, trend: genTrend(12, 0, 10) },
        { name: '被杀死的任务', value: '5', unit: '', isWarn: true, trend: genTrend(12, 0, 12) },
        { name: '正在挂起的任务', value: '2', unit: '', trend: genTrend(12, 0, 8) },
        { name: '超时的任务', value: '1', unit: '', isDanger: true, trend: genTrend(12, 0, 6) },
        { name: '非健康的节点数', value: '2', unit: '', isDanger: true, trend: genTrend(12, 0, 8) },
        { name: '丢失的节点数', value: '0', unit: '', trend: genTrend(12, 0, 5) },
      ]
    },
    {
      id: 'storm', name: 'Storm', icon: 'fa-solid fa-cloud-bolt', open: true,
      metrics: [
        { name: '空闲Slot数', value: '12', unit: '', trend: genTrend(12, 5, 25) },
        { name: '已用Slot数', value: '88', unit: '', trend: genTrend(12, 70, 100) },
        { name: 'Slot总数', value: '100', unit: '', trend: genTrend(12, 95, 105) },
      ]
    },
    {
      id: 'spark', name: 'Spark2x', icon: 'fa-solid fa-bolt', open: true,
      metrics: [
        { name: 'JDBC session使用率', value: '67', unit: '%', trend: genTrend(12, 40, 85) },
        { name: 'SQL成功率', value: '99.2', unit: '%', trend: genTrend(12, 97, 100) },
      ]
    },
    {
      id: 'solr', name: 'Solr', icon: 'fa-solid fa-magnifying-glass', open: true,
      metrics: [
        { name: '事件产生数量', value: '45,230', unit: '', trend: genTrend(12, 30000, 60000) },
        { name: '告警产生数量', value: '12', unit: '', isWarn: true, trend: genTrend(12, 0, 30) },
      ]
    },
    {
      id: 'oozie', name: 'Oozie', icon: 'fa-solid fa-clock-rotate-left', open: true,
      metrics: [
        { name: '告警产生数量', value: '5', unit: '', isWarn: true, trend: genTrend(12, 0, 15) },
        { name: '事件产生数量', value: '12,340', unit: '', trend: genTrend(12, 8000, 20000) },
      ]
    },
    {
      id: 'mapreduce', name: 'MapReduce', icon: 'fa-solid fa-arrows-spin', open: true,
      metrics: [
        { name: '阻塞线程数', value: '3', unit: '', trend: genTrend(12, 0, 8) },
        { name: '运行线程数', value: '45', unit: '', trend: genTrend(12, 30, 70) },
        { name: '垃圾回收时间统计', value: '230', unit: 'ms', trend: genTrend(12, 100, 400) },
      ]
    },
    {
      id: 'kafka', name: 'Kafka', icon: 'fa-solid fa-stream', open: true,
      metrics: [
        { name: '总体磁盘IO写速率', value: '3,456', unit: 'KB/s', trend: genTrend(12, 2000, 5000) },
        { name: 'Fetch请求平均总时延', value: '12', unit: 'ms', trend: genTrend(12, 5, 25) },
        { name: 'Produce请求平均总时延', value: '8', unit: 'ms', trend: genTrend(12, 3, 18) },
        { name: '总体磁盘IO读速率', value: '2,100', unit: 'KB/s', trend: genTrend(12, 1000, 3500) },
        { name: '总体CPU使用率', value: '45', unit: '%', trend: genTrend(12, 25, 65) },
        { name: '总体占用内存', value: '2,048', unit: 'MB', trend: genTrend(12, 1500, 2500) },
      ]
    },
    {
      id: 'hive', name: 'Hive', icon: 'fa-solid fa-database', open: true,
      metrics: [
        { name: '可用HDFS空间', value: '500', unit: 'GB', trend: genTrend(12, 400, 600) },
        { name: '已用HDFS空间', value: '320', unit: 'GB', trend: genTrend(12, 200, 450) },
        { name: 'session使用率', value: '45', unit: '%', trend: genTrend(12, 20, 70) },
        { name: 'MR任务占用内存', value: '1,024', unit: 'MB', trend: genTrend(12, 500, 1500) },
      ]
    },
    {
      id: 'hdfs', name: 'HDFS', icon: 'fa-solid fa-hard-drive', open: true,
      metrics: [
        { name: '缺失的块数量', value: '0', unit: '', trend: genTrend(12, 0, 5) },
        { name: '总体磁盘IO写速率', value: '5,678', unit: 'KB/s', trend: genTrend(12, 3000, 8000) },
        { name: 'HDFS文件总数', value: '234,567', unit: '', trend: genTrend(12, 200000, 280000) },
        { name: '总体CPU使用率', value: '34', unit: '%', trend: genTrend(12, 20, 50) },
        { name: '主NameNode RPC处理平均时间', value: '5', unit: 'ms', trend: genTrend(12, 2, 12) },
        { name: '磁盘空间使用率', value: '62', unit: '%', trend: genTrend(12, 45, 75) },
        { name: '故障的DataNode总数', value: '0', unit: '', trend: genTrend(12, 0, 4) },
        { name: '总体磁盘IO读速率', value: '4,321', unit: 'KB/s', trend: genTrend(12, 2000, 6000) },
        { name: '损坏的块数', value: '0', unit: '', trend: genTrend(12, 0, 5) },
        { name: '主NameNode RPC队列平均时间', value: '2', unit: 'ms', trend: genTrend(12, 0, 8) },
      ]
    },
    {
      id: 'hbase', name: 'HBase', icon: 'fa-solid fa-table-cells', open: true,
      metrics: [
        { name: '总体内存使用大小', value: '1,536', unit: 'MB', trend: genTrend(12, 1200, 1800) },
        { name: '总体磁盘IO读速率', value: '890', unit: 'KB/s', trend: genTrend(12, 500, 1500) },
        { name: '存在故障的RegionServer数', value: '0', unit: '', trend: genTrend(12, 0, 4) },
        { name: 'RIT阈值region数', value: '0', unit: '', trend: genTrend(12, 0, 5) },
        { name: '处在RIT状态的region数', value: '2', unit: '', trend: genTrend(12, 0, 8) },
        { name: 'RegionServer总请求数/每秒', value: '45,678', unit: '', trend: genTrend(12, 30000, 60000) },
        { name: 'RegionServer集群CPU', value: '38', unit: '%', trend: genTrend(12, 20, 55) },
        { name: '总体磁盘IO写速率', value: '670', unit: 'KB/s', trend: genTrend(12, 300, 1200) },
      ]
    },
    {
      id: 'flume', name: 'Flume', icon: 'fa-solid fa-water', open: true,
      metrics: [
        { name: '总体内存使用大小', value: '256', unit: 'MB', trend: genTrend(12, 150, 400) },
        { name: '服务总体CPU使用率', value: '12', unit: '%', trend: genTrend(12, 5, 25) },
        { name: '总体IO读速率', value: '234', unit: 'KB/s', trend: genTrend(12, 100, 500) },
        { name: '总体IO写速率', value: '189', unit: 'KB/s', trend: genTrend(12, 50, 400) },
      ]
    },
    {
      id: 'ftp', name: 'FTP Server', icon: 'fa-solid fa-folder-open', open: true,
      metrics: [
        { name: '总体内存使用大小', value: '128', unit: 'MB', trend: genTrend(12, 80, 200) },
        { name: '总体IO读速率', value: '567', unit: 'KB/s', trend: genTrend(12, 200, 900) },
        { name: '服务总体CPU使用率', value: '8', unit: '%', trend: genTrend(12, 3, 20) },
        { name: '总体IO写速率', value: '345', unit: 'KB/s', trend: genTrend(12, 150, 600) },
      ]
    },
    {
      id: 'elasticsearch', name: 'Elasticsearch', icon: 'fa-solid fa-magnifying-glass-chart', open: true,
      metrics: [
        { name: '副本分片数', value: '120', unit: '', trend: genTrend(12, 100, 150) },
        { name: 'Bad副本分片数', value: '2', unit: '', isDanger: true, trend: genTrend(12, 0, 8) },
        { name: '主分片数', value: '60', unit: '', trend: genTrend(12, 50, 80) },
        { name: 'Bad主分片数', value: '0', unit: '', trend: genTrend(12, 0, 5) },
        { name: '总分片数', value: '180', unit: '', trend: genTrend(12, 150, 220) },
        { name: '索引存储量', value: '56,789', unit: 'KB', trend: genTrend(12, 40000, 65000) },
        { name: '文档总条数', value: '1,234,567', unit: '', trend: genTrend(12, 1000000, 1300000) },
        { name: '集群可使用磁盘空间', value: '500,000', unit: 'KB', trend: genTrend(12, 400000, 600000) },
        { name: '集群已使用磁盘空间', value: '320,000', unit: 'KB', trend: genTrend(12, 200000, 400000) },
      ]
    },
    {
      id: 'dbservice', name: 'DBService', icon: 'fa-solid fa-plug', open: true,
      metrics: [
        { name: '数据库连接数使用率', value: '67', unit: '%', trend: genTrend(12, 40, 85) },
        { name: '数据库连接数最大值', value: '500', unit: '', trend: genTrend(12, 480, 520) },
        { name: '已使用的数据库连接数', value: '335', unit: '', trend: genTrend(12, 200, 450) },
      ]
    },
  ]
}

const subsystemGroups = ref(generateSubsystemGroups())

const filteredSubsystemGroups = computed(() => subsystemGroups.value)

const visibleSubsystems = computed(() => {
  if (activeSubsystem.value === 'all') return subsystemGroups.value
  return subsystemGroups.value.filter(g => g.id === activeSubsystem.value)
})

onMounted(() => { lastRefresh.value = new Date().toLocaleString() })

onBeforeUnmount(() => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
})
</script>

<style scoped>
.bd-dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 12px;
}

/* ① Toolbar */
.bd-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 4px;
}
.bd-toolbar-left, .bd-toolbar-right { display: flex; align-items: center; gap: 8px; }
.bd-time-pills {
  display: flex;
  gap: 2px;
  background: #fff;
  border-radius: 20px;
  padding: 2px;
  border: 1px solid #e8e8e8;
}
.bd-time-pill {
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
.bd-time-pill:hover { color: #1a1a1a; }
.bd-time-pill.active { background: #1890ff; color: #fff; }
.bd-header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 14px;
  border: 1px solid #e8e8e8;
  background: #fff;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.15s;
}
.bd-header-btn:hover { border-color: #d1d5db; color: #1a1a1a; }
.bd-last-refresh { font-size: 11px; color: #8c8c8c; }

/* ② Summary Cards */
.bd-summary {
  display: flex;
  gap: 16px;
}
.bd-summary-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.bd-summary-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bd-summary-icon i { font-size: 22px; color: #fff; }
.bd-summary-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.bd-summary-label { font-size: 13px; color: #8c8c8c; margin-top: 2px; }

/* ③ Section */
.bd-section {
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.bd-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* API Stats Row */
.bd-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.bd-stat-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: #f5f5f5;
  color: #595959;
}
.bd-stat-ok { background: #f6ffed; color: #52c41a; }
.bd-stat-warn { background: #fff7e6; color: #fa8c16; }
.bd-stat-danger { background: #fff1f0; color: #f5222d; }

/* API Table styles */
.bd-latency { font-weight: 600; }
.bd-latency-ok { color: #52c41a; }
.bd-latency-warn { color: #fa8c16; }
.bd-latency-danger { color: #f5222d; }
.bd-tps { font-weight: 500; }
.bd-rate-text { font-size: 12px; font-weight: 600; white-space: nowrap; }
.bd-rate-ok { color: #52c41a; }
.bd-rate-warn { color: #fa8c16; }
.bd-rate-danger { color: #f5222d; }
.bd-cell-spark-wrap { display: flex; flex-direction: row; align-items: center; gap: 6px; }
.bd-cell-spark { width: 80px; height: 14px; flex-shrink: 0; display: block; }

/* ④ Subsystem pills */
.bd-subsys-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.bd-subsys-pills button {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 14px;
  border: 1px solid #e8e8e8;
  background: #fff;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.15s;
}
.bd-subsys-pills button:hover { border-color: #1890ff; color: #1890ff; }
.bd-subsys-pills button.active { background: #1890ff; color: #fff; border-color: #1890ff; }

/* ⑤ Subsystem Grid */
.bd-subsys-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* Subsystem Card */
.bd-subsys-card {
  width: calc(25% - 12px);
  flex: none;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.bd-subsys-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.bd-subsys-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
  user-select: none;
}
.bd-subsys-header:hover { background: #f0f5ff; }
.bd-subsys-icon { color: #1890ff; font-size: 14px; flex-shrink: 0; }
.bd-subsys-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.bd-subsys-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: #8c8c8c;
}
.bd-chevron {
  font-size: 10px;
  color: #8c8c8c;
  transition: transform 0.2s;
}
.bd-chevron.rotated { transform: rotate(-90deg); }

/* Subsystem Body — Metric Grid */
.bd-subsys-body {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* Metric Card */
.bd-metric-card {
  width: calc(50% - 5px);
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
}
.bd-metric-label {
  font-size: 11px;
  color: #8c8c8c;
  line-height: 1.3;
}
.bd-metric-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.bd-metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}
.bd-metric-value.bd-normal { color: #52c41a; }
.bd-metric-value.bd-warn { color: #fa8c16; }
.bd-metric-value.bd-danger { color: #f5222d; }
.bd-metric-unit {
  font-size: 11px;
  color: #8c8c8c;
}
.bd-mini-spark { width: 100%; height: 16px; display: block; margin-top: 3px; }

/* Responsive */
@media (max-width: 1200px) { .bd-subsys-card { width: calc(33.33% - 11px); } }
@media (max-width: 768px) {
  .bd-subsys-card { width: calc(50% - 8px); }
  .bd-summary { flex-wrap: wrap; }
  .bd-summary-card { width: calc(50% - 8px); flex: none; }
  .bd-toolbar { flex-direction: column; align-items: flex-start; gap: 8px; }
}
@media (max-width: 420px) {
  .bd-subsys-card { width: 100%; }
  .bd-summary-card { width: 100%; }
}
</style>
