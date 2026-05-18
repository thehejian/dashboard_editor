<template>
  <div class="home-view">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <div class="welcome-bar">
          <div class="welcome-text">
            <h2>欢迎回来，管理员</h2>
            <p>这里是今天的系统概览</p>
          </div>
        </div>
      </a-col>

      <a-col :xs="12" :sm="12" :md="6" v-for="card in kpiCards" :key="card.title">
        <div class="kpi-card" :class="card.bgClass">
          <div class="card-header">
            <div class="card-icon" :style="{ background: card.iconBg }">
              <i :class="card.icon" :style="{ color: card.iconColor }"></i>
            </div>
            <span class="card-title">{{ card.title }}</span>
            <div class="card-actions">
              <a-button type="text" size="small" class="action-btn" @click.stop="refreshCard(card)" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" @click.stop="openDetailPanel(card)" title="查看详情">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu @click="({key}) => handleCardAction(card, key)">
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
          <div class="card-value">
            <span class="value">{{ card.value }}</span>
            <span class="trend" :class="card.trend > 0 ? 'up' : 'down'" v-if="card.trend !== undefined">
              <i :class="card.trend > 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              {{ card.trendText }}
            </span>
          </div>
          <div class="card-sub" v-if="card.sub">{{ card.sub }}</div>
        </div>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card class="chart-card donut-card">
          <template #title>
            <span>资源分类分布</span>
          </template>
          <template #extra>
            <div class="chart-actions">
              <a-button type="text" size="small" class="action-btn" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" title="查看详情" @click="openDetailPanel({title: '资源分类分布'})">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
          <div class="donut-chart">
            <div class="donut-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="none" stroke="#f0f0f0" stroke-width="12"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#007BFF" stroke-width="12"
                  stroke-dasharray="99 220" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#69C0FF" stroke-width="12"
                  stroke-dasharray="66 220" stroke-dashoffset="-99" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#52C41A" stroke-width="12"
                  stroke-dasharray="33 220" stroke-dashoffset="-165" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="#FA8C16" stroke-width="12"
                  stroke-dasharray="22 220" stroke-dashoffset="-198" transform="rotate(-90 50 50)"/>
              </svg>
              <div class="donut-center">
                <span class="total">1,234,567</span>
                <span class="label">资源总数</span>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item" v-for="item in resourceDist" :key="item.name">
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-percent">{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card class="chart-card line-card">
          <template #title>
            <span>告警趋势</span>
          </template>
          <template #extra>
            <div class="chart-actions">
              <a-button type="text" size="small" class="action-btn" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" title="查看详情" @click="openDetailPanel({title: '告警趋势'})">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
          <div class="line-chart" ref="alertTrendContainer"></div>
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card class="table-card">
          <template #title>
            <span>最近告警事件</span>
          </template>
          <template #extra>
            <a-button type="link">查看全部</a-button>
          </template>
          <a-table :columns="alertColumns" :dataSource="alertEvents" :pagination="false" size="small" rowKey="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="record.level === '严重' ? 'pink' : 'orange'">{{ record.level }}</a-tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <span :class="'status-' + record.status">{{ record.status }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small">查看详情</a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <div class="detail-panel" :class="{ open: detailPanelOpen }">
      <div class="detail-mask" @click="closeDetailPanel"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ currentCardTitle }} - 历史详情</h3>
          <a-button type="text" class="close-btn" @click="closeDetailPanel">
            <i class="fa-solid fa-xmark"></i>
          </a-button>
        </div>
        <div class="detail-body">
          <div class="time-tabs">
            <a-radio-group v-model:value="detailPeriod" button-style="solid" size="small">
              <a-radio-button value="today">今日</a-radio-button>
              <a-radio-button value="week">本周</a-radio-button>
              <a-radio-button value="month">本月</a-radio-button>
              <a-radio-button value="quarter">本季度</a-radio-button>
            </a-radio-group>
          </div>
          <div class="detail-chart">
            <div v-if="detailType === 'resource'">
              <svg class="detail-line-svg" viewBox="0 0 400 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="detailAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#1890ff;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#1890ff;stop-opacity:0.05"/>
                  </linearGradient>
                </defs>
                <g class="grid-lines">
                  <line x1="0" y1="36" x2="400" y2="36" stroke="#f0f0f0" stroke-width="1"/>
                  <line x1="0" y1="72" x2="400" y2="72" stroke="#f0f0f0" stroke-width="1"/>
                  <line x1="0" y1="108" x2="400" y2="108" stroke="#f0f0f0" stroke-width="1"/>
                  <line x1="0" y1="144" x2="400" y2="144" stroke="#f0f0f0" stroke-width="1"/>
                </g>
                <path class="area-fill" d="M0,90 L57,85 L114,88 L171,82 L228,86 L285,80 L342,84 L400,78 L400,180 L0,180 Z" fill="url(#detailAreaGradient)"/>
                <path class="line-path" d="M0,90 L57,85 L114,88 L171,82 L228,86 L285,80 L342,84 L400,78" fill="none" stroke="#1890ff" stroke-width="2.5"/>
                <circle cx="0" cy="90" r="4" fill="#1890ff"/>
                <circle cx="57" cy="85" r="4" fill="#1890ff"/>
                <circle cx="114" cy="88" r="4" fill="#1890ff"/>
                <circle cx="171" cy="82" r="4" fill="#1890ff"/>
                <circle cx="228" cy="86" r="4" fill="#1890ff"/>
                <circle cx="285" cy="80" r="4" fill="#1890ff"/>
                <circle cx="342" cy="84" r="4" fill="#1890ff"/>
                <circle cx="400" cy="78" r="4" fill="#1890ff"/>
              </svg>
              <div class="detail-labels">
                <span>周一</span><span>周二</span><span>周三</span><span>周四</span>
                <span>周五</span><span>周六</span><span>周日</span>
              </div>
              <div class="y-axis">
                <span>1,400,000</span><span>1,200,000</span>
                <span>1,000,000</span><span>800,000</span><span>0</span>
              </div>
            </div>
            <div v-else class="health-trend-chart" ref="healthTrendContainer"></div>
          </div>
          <div v-if="detailType === 'resource'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前资源总数</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">1,235,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">1,229,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+15%</span>
            </div>
          </div>
          <div v-if="detailType === 'health'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前健康资源</span>
              <span class="dk-value">{{ healthData.kpi.current }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值数量</span>
              <span class="dk-value">{{ healthData.kpi.peak }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">{{ healthData.kpi.avg }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">{{ healthData.kpi.change }}</span>
            </div>
          </div>
          <div v-if="detailType === 'resource'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="detailSearch" placeholder="搜索资源类型" style="width: 200px" />
            </div>
            <a-table
              :columns="detailColumns"
              :dataSource="filteredDetailData"
              :pagination="{ current: detailPage, pageSize: 5, total: filteredDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="type"
              @change="handleDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'added'">
                  <span :class="record.added > 0 ? 'num-up' : 'num-down'">+{{ record.added }}</span>
                </template>
                <template v-else-if="column.key === 'removed'">
                  <span :class="record.removed > 0 ? 'num-down' : 'num-up'">-{{ record.removed }}</span>
                </template>
                <template v-else-if="column.key === 'net'">
                  <span :class="record.net > 0 ? 'num-up' : 'num-down'">
                    {{ record.net > 0 ? '+' : '' }}{{ record.net }}
                  </span>
                </template>
              </template>
            </a-table>
          </div>
          <div v-if="detailType === 'health'" class="detail-table">
            <h4>详细数据</h4>
            <a-table
              :columns="healthColumns"
              :dataSource="healthData.tableData"
              :pagination="false"
              size="small"
              rowKey="range"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'percent'">
                  <div class="bar-cell">
                    <div class="bar-bg">
                      <div class="bar-fill" :style="{ width: record.percent + '%' }"></div>
                    </div>
                    <span>{{ record.percent }}%</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'status'">
                  <span :class="'health-' + (record.range === '100%' ? 'good' : record.range === '<80%' ? 'bad' : 'warn')">{{ record.status }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </div>
        <div class="detail-footer">
          <div></div>
          <div class="footer-actions">
            <a-button type="primary" class="export-btn">
              <i class="fa-solid fa-download"></i> 导出数据
            </a-button>
            <a-button @click="closeDetailPanel">关闭</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { Chart } from '@antv/g2'

const detailPanelOpen = ref(false)
const currentCardTitle = ref('')
const detailPeriod = ref('week')
const detailType = ref('resource')

const healthData = reactive({
  kpi: { current: '1,180,234', peak: '1,185,000', avg: '1,175,000', change: '+8%' },
  trendData: [
    { day: '5月16', healthy100: 800000, healthy95: 250000, healthy90: 80000, healthy80: 30000, healthyBelow: 20000 },
    { day: '5月17', healthy100: 820000, healthy95: 240000, healthy90: 75000, healthy80: 28000, healthyBelow: 18000 },
    { day: '5月18', healthy100: 810000, healthy95: 260000, healthy90: 70000, healthy80: 35000, healthyBelow: 15000 },
    { day: '5月19', healthy100: 830000, healthy95: 230000, healthy90: 80000, healthy80: 25000, healthyBelow: 20000 },
    { day: '5月20', healthy100: 840000, healthy95: 220000, healthy90: 75000, healthy80: 30000, healthyBelow: 15000 },
    { day: '5月21', healthy100: 850000, healthy95: 210000, healthy90: 70000, healthy80: 28000, healthyBelow: 20000 },
    { day: '5月22', healthy100: 860000, healthy95: 200000, healthy90: 75000, healthy80: 25000, healthyBelow: 20000 },
  ],
  tableData: [
    { range: '100%', count: 860000, percent: 69.7, status: '健康' },
    { range: '95%~99%', count: 200000, percent: 16.2, status: '良好' },
    { range: '90%~94%', count: 75000, percent: 6.1, status: '警告' },
    { range: '80%~89%', count: 25000, percent: 2.0, status: '异常' },
    { range: '<80%', count: 20000, percent: 1.6, status: '严重' },
  ],
})

const healthColumns = [
  { title: '健康率范围', dataIndex: 'range', key: 'range' },
  { title: '资源数量', dataIndex: 'count', key: 'count', align: 'right', sorter: (a, b) => a.count - b.count },
  { title: '占比', dataIndex: 'percent', key: 'percent', align: 'right' },
  { title: '状态', dataIndex: 'status', key: 'status' },
]

const healthTrendContainer = ref(null)
let healthTrendChart = null

function renderHealthTrendChart() {
  if (healthTrendChart) { healthTrendChart.destroy(); healthTrendChart = null }
  if (!healthTrendContainer.value) return

  healthTrendChart = new Chart({
    container: healthTrendContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 10, 20, 20],
  })

  const chartData = healthData.trendData.flatMap(d => [
    { day: d.day, type: '100%', value: d.healthy100 },
    { day: d.day, type: '95%~99%', value: d.healthy95 },
    { day: d.day, type: '90%~94%', value: d.healthy90 },
    { day: d.day, type: '80%~89%', value: d.healthy80 },
    { day: d.day, type: '<80%', value: d.healthyBelow },
  ])

  healthTrendChart.data(chartData)

  healthTrendChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')

  healthTrendChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)

  healthTrendChart.axis('x', { title: null, labelFontSize: 11, labelFill: '#9CA3AF' })
  healthTrendChart.axis('y', { title: null, labelFontSize: 11, labelFill: '#9CA3AF', gridStroke: '#f0f0f0', gridLineWidth: 1 })
  healthTrendChart.legend('color', { position: 'bottom', itemSpacing: 16 })

  healthTrendChart.render()
}
const detailSearch = ref('')
const detailPage = ref(1)

const detailData = reactive([
  { type: 'ECS', added: 320, removed: 85, net: 235, total: '555,555' },
  { type: 'MySQL', added: 45, removed: 12, net: 33, total: '1,850' },
  { type: 'Redis', added: 28, removed: 8, net: 20, total: '1,200' },
  { type: 'K8s Pod', added: 580, removed: 165, net: 415, total: '370,370' },
  { type: 'SLB', added: 18, removed: 5, net: 13, total: '850' },
  { type: 'RDS', added: 35, removed: 10, net: 25, total: '920' },
  { type: 'OSS', added: 95, removed: 38, net: 67, total: '12,500' },
])

const detailColumns = [
  { title: '资源类型', dataIndex: 'type', key: 'type', filters: detailData.map(d => ({ text: d.type, value: d.type })), onFilter: (value, record) => record.type === value },
  { title: '新增', dataIndex: 'added', key: 'added', align: 'right', sorter: (a, b) => a.added - b.added },
  { title: '退出', dataIndex: 'removed', key: 'removed', align: 'right', sorter: (a, b) => a.removed - b.removed },
  { title: '净变化', dataIndex: 'net', key: 'net', align: 'right', sorter: (a, b) => a.net - b.net },
  { title: '当前总数', dataIndex: 'total', key: 'total', align: 'right' },
]

const filteredDetailData = computed(() => {
  if (!detailSearch.value) return detailData
  return detailData.filter(item => item.type.toLowerCase().includes(detailSearch.value.toLowerCase()))
})

const handleDetailTableChange = (pag) => {
  detailPage.value = pag.current
}

watch(detailPanelOpen, (val) => {
  if (val) {
    detailPeriod.value = 'week'
    detailSearch.value = ''
    detailPage.value = 1
    nextTick(() => {
      if (detailType.value === 'health') renderHealthTrendChart()
    })
  }
})

const openDetailPanel = (card) => {
  currentCardTitle.value = card.title
  if (card.title === '健康资源') {
    detailType.value = 'health'
  } else if (card.title === '资源总数') {
    detailType.value = 'resource'
  } else if (card.title === '当日告警') {
    detailType.value = 'alert'
  } else if (card.title === '资源分类分布') {
    detailType.value = 'distribution'
  } else if (card.title === '告警趋势') {
    detailType.value = 'trend'
  }
  detailPanelOpen.value = true
}

const closeDetailPanel = () => {
  detailPanelOpen.value = false
}

const handleCardAction = (card, key) => {
  if (key === 'detail') {
    openDetailPanel(card)
    return
  }
  const actions = {
    export: '导出数据',
    history: '历史趋势',
  }
  message.info(`${card.title} - ${actions[key]}`)
}

const kpiCards = reactive([
  {
    title: '资源总数',
    value: '1,234,567',
    trend: 12,
    trendText: '较上月 +12%',
    icon: 'fa-solid fa-layer-group',
    iconBg: '#e6f7ff',
    iconColor: '#007BFF',
    sub: ' ',
  },
  {
    title: '健康资源',
    value: '1,180,234',
    trend: undefined,
    trendText: '',
    icon: 'fa-solid fa-circle-check',
    iconBg: '#f6ffed',
    iconColor: '#52C41A',
    sub: '健康率 95.6%',
  },
  {
    title: '当日告警',
    value: '54,333',
    trend: -8,
    trendText: '较上周 -8%',
    icon: 'fa-solid fa-triangle-exclamation',
    iconBg: '#fff7e6',
    iconColor: '#FA8C16',
    sub: ' ',
  },
  {
    title: '今日事件',
    value: '128',
    trend: 5,
    trendText: '较昨日 +5%',
    icon: 'fa-solid fa-bell',
    iconBg: '#fff0f6',
    iconColor: '#EB2F96',
    sub: ' ',
  },
])

const resourceDist = reactive([
  { name: '业务应用', percent: 45, color: '#007BFF' },
  { name: '云服务', percent: 30, color: '#69C0FF' },
  { name: '云资源', percent: 15, color: '#52C41A' },
  { name: '物理资源', percent: 10, color: '#FA8C16' },
])

const alertColumns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
  { title: 'CI名称', dataIndex: 'ciName', key: 'ciName' },
  { title: 'CI类型', dataIndex: 'ciType', key: 'ciType', width: 80 },
  { title: '事件', dataIndex: 'event', key: 'event' },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 100 },
]

const alertEvents = reactive([
  { id: 1, time: '10:23', ciName: 'ecs-prod-001', ciType: 'ECS', event: 'CPU使用率过高', level: '严重', status: '处理中' },
  { id: 2, time: '10:15', ciName: 'mysql-01', ciType: 'MySQL', event: '连接数超限', level: '警告', status: '已恢复' },
  { id: 3, time: '09:58', ciName: 'redis-01', ciType: 'Redis', event: '内存使用率过高', level: '警告', status: '处理中' },
  { id: 4, time: '09:45', ciName: 'k8s-node-03', ciType: 'K8s', event: '节点离线', level: '严重', status: '已处理' },
  { id: 5, time: '09:30', ciName: 'slb-prod-01', ciType: 'SLB', event: '后端健康检查失败', level: '警告', status: '已恢复' },
])

const alertTrendContainer = ref(null)
let alertTrendChart = null

const alertTrendData = [
  { date: '5月16', value: 45 },
  { date: '5月17', value: 52 },
  { date: '5月18', value: 38 },
  { date: '5月19', value: 65 },
  { date: '5月20', value: 48 },
  { date: '5月21', value: 35 },
  { date: '5月22', value: 42 },
]

function renderAlertTrendChart() {
  if (alertTrendChart) { alertTrendChart.destroy(); alertTrendChart = null }
  if (!alertTrendContainer.value) return

  alertTrendChart = new Chart({
    container: alertTrendContainer.value,
    autoFit: true,
    height: 192,
    padding: [20, 20, 20, 40],
  })

  alertTrendChart.data(alertTrendData)

  alertTrendChart.area()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('fill', 'l(0) 0:#ff4d4f30 1:#ff4d4f05')
    .style('shape', 'smooth')

  alertTrendChart.line()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('stroke', '#ff4d4f')
    .style('lineWidth', 2.5)
    .style('shape', 'smooth')

  alertTrendChart.point()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('fill', '#ff4d4f')
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .style('size', 5)

  alertTrendChart.axis('x', { title: null, labelFontSize: 11, labelFill: '#9CA3AF' })
  alertTrendChart.axis('y', { title: null, labelFontSize: 11, labelFill: '#9CA3AF', gridStroke: '#f0f0f0', gridLineWidth: 1 })

  alertTrendChart.render()
}

onMounted(() => { renderAlertTrendChart() })

onBeforeUnmount(() => {
  if (alertTrendChart) { alertTrendChart.destroy(); alertTrendChart = null }
  if (healthTrendChart) { healthTrendChart.destroy(); healthTrendChart = null }
})

const refreshCard = (card) => {
  message.success(`刷新 ${card.title} 数据`)
}
</script>

<style scoped>
.home-view { padding: 24px; min-height: 100%; }
.welcome-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.welcome-text h2 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
.welcome-text p { color: var(--text-secondary); margin: 0; }

.kpi-card {
  padding: 16px 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}
.kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.kpi-card:hover .card-actions { opacity: 1; }

.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.card-title { font-size: 14px; color: var(--text-secondary); flex: 1; }
.card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.action-btn { padding: 2px 6px; color: var(--text-secondary); }
.action-btn:hover { color: #1890ff; }

.card-value { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
.card-value .value { font-size: 28px; font-weight: 600; color: #1a1a1a; }
.trend { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.trend.up { color: #52C41A; }
.trend.down { color: #f5222d; }
.card-sub { font-size: 12px; color: var(--text-secondary); min-height: 16px; }

.chart-card :deep(.ant-card-head) { border-bottom: 1px solid #f0f0f0; }
.chart-card :deep(.ant-card-body) { padding: 20px; }
.chart-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.chart-card:hover .chart-actions { opacity: 1; }
.chart-actions .action-btn { padding: 2px 6px; color: var(--text-secondary); }
.chart-actions .action-btn:hover { color: #1890ff; }

.donut-chart { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 16px 0; }
.donut-ring { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
.donut-ring svg { width: 100%; height: 100%; }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.donut-center .total { display: block; font-size: 20px; font-weight: 600; color: #1a1a1a; }
.donut-center .label { font-size: 12px; color: var(--text-secondary); }
.donut-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.legend-name { flex: 1; min-width: 60px; }
.legend-percent { color: var(--text-secondary); min-width: 35px; text-align: right; }

.line-chart { position: relative; height: 192px; min-height: 192px; }
.health-trend-chart { height: 180px; min-height: 180px; }
.line-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

.chart-card { min-height: 270px; }
.chart-card :deep(.ant-card-body) { height: calc(100% - 57px); display: flex; flex-direction: column; justify-content: center; }
.table-card :deep(.ant-card-head-title) { font-weight: 600; }
.table-card :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.status-处理中 { color: #8c8c8c; }
.status-已恢复, .status-已处理 { color: #52C41A; }

@media (max-width: 768px) {
  .donut-chart { flex-direction: column; }
  .donut-legend { flex-direction: row; flex-wrap: wrap; }
  .card-actions { opacity: 1; }
}

.detail-panel {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.detail-panel.open {
  pointer-events: auto;
  opacity: 1;
}
.detail-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
}
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -500px;
  width: 500px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
}
.detail-panel.open .detail-panel-content {
  right: 0;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.close-btn { font-size: 16px; color: #8c8c8c; }
.close-btn:hover { color: #1890ff; }

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.time-tabs { margin-bottom: 20px; }
.time-tabs :deep(.ant-radio-group) { width: 100%; display: flex; }
.time-tabs :deep(.ant-radio-button-wrapper) { flex: 1; text-align: center; position: relative; z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper:hover) { z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper-checked) { background: #1890ff; border-color: #1890ff; color: #fff; z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper::before) { z-index: 0; }

.detail-chart { position: relative; margin-bottom: 24px; }
.detail-line-svg { width: 100%; height: 180px; }
.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}
.detail-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.detail-kpi {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}
.detail-kpi-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dk-label { font-size: 12px; color: var(--text-secondary); }
.dk-value { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.dk-value.up { color: #52C41A; }

.detail-table h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.table-toolbar { margin-bottom: 12px; }
.detail-table :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.detail-table :deep(.ant-pagination) { margin-top: 12px; }
.bar-cell { display: flex; align-items: center; gap: 6px; }
.bar-bg { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; min-width: 100px; }
.bar-fill { height: 100%; background: #1890ff; border-radius: 5px; }
.health-good { color: #52C41A; }
.health-warn { color: #fa8c16; }
.health-bad { color: #f5222d; }
.num-up { color: #52C41A; }
.num-down { color: #f5222d; }

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}
.footer-actions { display: flex; gap: 16px; }
.export-btn { display: flex; align-items: center; gap: 6px; }
</style>