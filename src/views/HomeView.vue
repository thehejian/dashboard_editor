<template>
  <div class="home-view">
    <a-row :gutter="[16, 16]">
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
          <div ref="mainDonutContainer" class="main-donut-chart"></div>
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
          <a-table :columns="alertColumns" :dataSource="alertEvents" :pagination="false" size="small" rowKey="id" :scroll="{ x: 700 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="record.level === '严重' ? 'pink' : 'orange'">{{ record.level }}</a-tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <span :class="'status-' + record.status">{{ record.status }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openAlertEventDetail(record)">查看详情</a-button>
              </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="detail-panel" :class="{ open: detailPanelOpen }">
      <div class="detail-mask" @click="closeDetailPanel"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ alertEventRecord ? '告警事件详情' : currentCardTitle + ' - 历史详情' }}</h3>
          <a-button type="text" class="close-btn" @click="closeDetailPanel">
            <i class="fa-solid fa-xmark"></i>
          </a-button>
        </div>
        <div class="detail-body">
          <template v-if="!alertEventRecord">
          <div class="time-tabs">
            <a-radio-group v-model:value="detailPeriod" button-style="solid" size="small">
              <a-radio-button value="today">今日</a-radio-button>
              <a-radio-button value="week">本周</a-radio-button>
              <a-radio-button value="month">本月</a-radio-button>
              <a-radio-button value="quarter">本季度</a-radio-button>
            </a-radio-group>
          </div>
          <div class="detail-chart">
            <div v-if="detailType === 'resource'" ref="resourceTrendContainer"></div>
            <div v-else-if="detailType === 'health'" class="health-trend-chart" ref="healthTrendContainer"></div>
            <div v-else-if="detailType === 'alert'" class="alert-trend-chart" ref="alertDetailContainer"></div>
            <div v-else-if="detailType === 'event'" class="event-trend-chart" ref="eventDetailContainer"></div>
            <div v-else-if="detailType === 'distribution'" class="dist-donut-chart" ref="distDonutContainer"></div>
            <div v-else-if="detailType === 'trend'" class="trend-single-chart" ref="trendSingleContainer"></div>
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
          <div v-else-if="detailType === 'alert'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前告警</span>
              <span class="dk-value">54,333</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">58,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">55,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value down">-10%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'event'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">128</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">128</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">100</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+8%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'distribution'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">1,229,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+5%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'trend'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">42</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">65</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">46</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value down">-12%</span>
            </div>
          </div>
          <div v-if="detailType === 'resource'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="detailSearch" placeholder="搜索资源类型" class="detail-search" />
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
          <div v-else-if="detailType === 'alert'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="alertDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="alertDetailColumns"
              :dataSource="filteredAlertDetailData"
              :pagination="{ current: alertDetailPage, pageSize: 10, total: filteredAlertDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="alertId"
              @change="handleAlertDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <a-tag :color="record.level === '严重' ? '#f5222d' : '#fa8c16'" style="color:#fff;border:none;">{{ record.level }}</a-tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="record.status === '处理中' ? '#fa8c16' : '#52C41A'" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'event'" class="detail-table">
            <h4>详细数据</h4>
            <a-table
              :columns="eventDetailColumns"
              :dataSource="eventDetailData"
              :pagination="false"
              size="small"
              rowKey="level"
              :scroll="{ x: 600 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <a-tag :color="record.level === '严重' ? '#f5222d' : record.level === '警告' ? '#fa8c16' : '#8c8c8c'" style="color:#fff;border:none;">{{ record.level }}</a-tag>
                </template>
                <template v-else-if="column.key === 'percent'">
                  <div class="bar-cell bar-cell-inline">
                    <div class="bar-bg bar-bg-sm">
                      <div class="bar-fill" :style="{ width: record.percent + '%', background: record.level === '严重' ? '#f5222d' : record.level === '警告' ? '#fa8c16' : '#8c8c8c' }"></div>
                    </div>
                    <span>{{ record.percent }}%</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'trend'">
                  <span :class="'trend-' + (record.trend === '下降' ? 'down' : record.trend === '上升' ? 'up' : 'stable')">{{ record.trend }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'distribution'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="distDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="distDetailColumns"
              :dataSource="filteredDistDetailData"
              :pagination="{ current: distDetailPage, pageSize: 10, total: filteredDistDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="name"
              @change="handleDistDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag color="#52C41A" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'trend'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="trendDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="trendDetailColumns"
              :dataSource="filteredTrendDetailData"
              :pagination="{ current: trendDetailPage, pageSize: 10, total: filteredTrendDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="name"
              @change="handleTrendDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === '警告' ? '#fa8c16' : '#f5222d'" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          </template>
          <template v-else>
          <div class="alert-summary-card">
            <a-tag color="#f5222d" style="color:#fff;border:none;font-size:13px;padding:2px 10px;border-radius:4px;">{{ alertEventRecord.level }}</a-tag>
            <span class="alert-event-name">{{ alertEventRecord.event }}</span>
            <span class="alert-event-time">{{ alertEventRecord.time }}</span>
          </div>
          <div class="ci-info-table">
            <div class="ci-row">
              <span class="ci-label">CI名称</span>
              <span class="ci-value">{{ alertEventRecord.ciName }}</span>
              <span class="ci-label">CI类型</span>
              <span class="ci-value">{{ alertEventRecord.ciType }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警级别</span>
              <span class="ci-value"><a-tag color="#f5222d" style="color:#fff;border:none;">{{ alertEventRecord.level }}</a-tag></span>
              <span class="ci-label">当前状态</span>
              <span class="ci-value"><a-tag color="#fa8c16" style="color:#fff;border:none;">{{ alertEventRecord.status }}</a-tag></span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警时间</span>
              <span class="ci-value">{{ alertEventRecord.time }}</span>
              <span class="ci-label"></span>
              <span class="ci-value"></span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警事件</span>
              <span class="ci-value">{{ alertEventRecord.event }}</span>
              <span class="ci-label"></span>
              <span class="ci-value"></span>
            </div>
          </div>
          <div class="timeline-section">
            <h4>处理历史</h4>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot red"></div>
                <div class="timeline-line"></div>
                <div class="timeline-content">
                  <span class="timeline-time">2024-01-15 10:23:00</span>
                  <span class="timeline-title">告警触发</span>
                  <span class="timeline-operator">操作人：系统</span>
                  <span class="timeline-note">{{ alertEventRecord.ciName }} 触发 {{ alertEventRecord.event }} 告警</span>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot yellow"></div>
                <div class="timeline-content">
                  <span class="timeline-time">2024-01-15 10:25:00</span>
                  <span class="timeline-title">开始处理</span>
                  <span class="timeline-operator">操作人：运维工程师</span>
                  <span class="timeline-note">正在排查问题原因</span>
                </div>
              </div>
            </div>
          </div>
          </template>
        </div>
        <div class="detail-footer">
          <template v-if="alertEventRecord">
            <div></div>
            <div class="footer-actions">
              <a-button @click="closeDetailPanel">关闭</a-button>
              <a-button type="primary">处理告警</a-button>
            </div>
          </template>
          <template v-else>
          <div></div>
          <div class="footer-actions">
            <a-button type="primary" class="export-btn">
              <i class="fa-solid fa-download"></i> 导出数据
            </a-button>
            <a-button @click="closeDetailPanel">关闭</a-button>
          </div>
          </template>
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
const alertEventRecord = ref(null)

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
    padding: [20, 20, 16, 20],
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

  healthTrendChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

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

const alertDetailContainer = ref(null)
let alertDetailChart = null
const alertDetailSearch = ref('')
const alertDetailPage = ref(1)

const alertDetailTrendData = [
  { day: '5月15', critical: 9500, warning: 38000, info: 4500 },
  { day: '5月16', critical: 10000, warning: 40000, info: 5000 },
  { day: '5月17', critical: 9500, warning: 41000, info: 4800 },
  { day: '5月18', critical: 9000, warning: 39000, info: 4500 },
  { day: '5月19', critical: 8500, warning: 40000, info: 4200 },
  { day: '5月20', critical: 8000, warning: 38000, info: 4000 },
  { day: '5月21', critical: 8800, warning: 40000, info: 4500 },
  { day: '5月22', critical: 10000, warning: 42000, info: 4800 },
]

const alertDetailColumns = [
  { title: '告警ID', dataIndex: 'alertId', key: 'alertId', width: 130, fixed: 'left' },
  { title: '资源名称', dataIndex: 'resourceName', key: 'resourceName', width: 120, fixed: 'left' },
  { title: '资源类型', dataIndex: 'resourceType', key: 'resourceType', width: 80 },
  { title: '告警级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '告警类型', dataIndex: 'alertType', key: 'alertType', width: 120 },
  { title: '告警时间', dataIndex: 'alertTime', key: 'alertTime', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
]

const alertDetailData = [
  { alertId: 'ALT-2024011501', resourceName: 'ecs-prod-01', resourceType: 'ECS', level: '严重', alertType: 'CPU使用率过高', alertTime: '2024-01-15 10:23', status: '处理中' },
  { alertId: 'ALT-2024011502', resourceName: 'mysql-01', resourceType: 'MySQL', level: '严重', alertType: '连接数超限', alertTime: '2024-01-15 10:15', status: '处理中' },
  { alertId: 'ALT-2024011503', resourceName: 'redis-01', resourceType: 'Redis', level: '警告', alertType: '内存使用率过高', alertTime: '2024-01-15 09:58', status: '处理中' },
  { alertId: 'ALT-2024011504', resourceName: 'k8s-node-03', resourceType: 'K8s', level: '严重', alertType: '节点离线', alertTime: '2024-01-15 09:45', status: '已处理' },
  { alertId: 'ALT-2024011505', resourceName: 'slb-prod-01', resourceType: 'SLB', level: '警告', alertType: '后端健康检查失败', alertTime: '2024-01-15 09:30', status: '已恢复' },
]

const filteredAlertDetailData = computed(() => {
  if (!alertDetailSearch.value) return alertDetailData
  const q = alertDetailSearch.value.toLowerCase()
  return alertDetailData.filter(item =>
    item.resourceName.toLowerCase().includes(q) ||
    item.alertId.toLowerCase().includes(q)
  )
})

const handleAlertDetailTableChange = (pag) => {
  alertDetailPage.value = pag.current
}

function renderAlertDetailChart() {
  if (alertDetailChart) { alertDetailChart.destroy(); alertDetailChart = null }
  if (!alertDetailContainer.value) return

  alertDetailChart = new Chart({
    container: alertDetailContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 16, 20],
  })

  const chartData = alertDetailTrendData.flatMap(d => [
    { day: d.day, type: '严重', value: d.critical },
    { day: d.day, type: '警告', value: d.warning },
    { day: d.day, type: '信息', value: d.info },
  ])

  alertDetailChart.data(chartData)
  alertDetailChart.scale('color', { range: ['#f5222d', '#fa8c16', '#8c8c8c'] })

  alertDetailChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fillOpacity', 0.08)
    .style('shape', 'smooth')

  alertDetailChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')

  alertDetailChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)

  alertDetailChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  alertDetailChart.render()
}

const eventDetailContainer = ref(null)
let eventDetailChart = null

const eventDetailTrendData = [
  { day: '5月15', critical: 45, warning: 60, info: 20 },
  { day: '5月16', critical: 40, warning: 65, info: 22 },
  { day: '5月17', critical: 35, warning: 55, info: 18 },
  { day: '5月18', critical: 50, warning: 70, info: 25 },
  { day: '5月19', critical: 42, warning: 58, info: 20 },
  { day: '5月20', critical: 38, warning: 62, info: 24 },
  { day: '5月21', critical: 48, warning: 60, info: 26 },
]

const eventDetailColumns = [
  { title: '事件级别', dataIndex: 'level', key: 'level', width: 100 },
  { title: '事件数量', dataIndex: 'count', key: 'count', align: 'right' },
  { title: '占比', dataIndex: 'percent', key: 'percent' },
  { title: '趋势', dataIndex: 'trend', key: 'trend', width: 80 },
]

const eventDetailData = [
  { level: '严重', count: 32, percent: 25, trend: '下降' },
  { level: '警告', count: 70, percent: 54.7, trend: '稳定' },
  { level: '信息', count: 26, percent: 20.3, trend: '上升' },
]

function renderEventDetailChart() {
  if (eventDetailChart) { eventDetailChart.destroy(); eventDetailChart = null }
  if (!eventDetailContainer.value) return

  eventDetailChart = new Chart({
    container: eventDetailContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 16, 20],
  })

  const chartData = eventDetailTrendData.flatMap(d => [
    { day: d.day, type: '严重', value: d.critical },
    { day: d.day, type: '警告', value: d.warning },
    { day: d.day, type: '信息', value: d.info },
  ])

  eventDetailChart.data(chartData)
  eventDetailChart.scale('color', { range: ['#f5222d', '#fa8c16', '#8c8c8c'] })

  eventDetailChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fillOpacity', 0.08)
    .style('shape', 'smooth')

  eventDetailChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')

  eventDetailChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)

  eventDetailChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  eventDetailChart.render()
}

const distDonutContainer = ref(null)
let distDonutChart = null
const distDetailSearch = ref('')
const distDetailPage = ref(1)

const distDonutData = [
  { name: '业务应用', value: 555555, color: '#007BFF' },
  { name: '云服务', value: 370370, color: '#69C0FF' },
  { name: '云资源', value: 185185, color: '#52C41A' },
  { name: '物理资源', value: 123457, color: '#FA8C16' },
]

const distDetailColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
]

const distDetailData = [
  { name: '弹性服务器', type: 'ECS', status: '正常', updateTime: '2024-01-15 10:30', desc: 'ECS实例总数: 555,555' },
  { name: '容器', type: '容器', status: '正常', updateTime: '2024-01-15 10:30', desc: 'Pod总数: 370,370' },
  { name: '业务服务', type: '服务', status: '正常', updateTime: '2024-01-15 10:30', desc: '服务实例数: 185,185' },
  { name: '物理设备', type: '物理', status: '正常', updateTime: '2024-01-15 10:30', desc: '物理机数量: 123,457' },
]

const filteredDistDetailData = computed(() => {
  if (!distDetailSearch.value) return distDetailData
  const q = distDetailSearch.value.toLowerCase()
  return distDetailData.filter(item =>
    item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  )
})

const handleDistDetailTableChange = (pag) => {
  distDetailPage.value = pag.current
}

function renderDistDonutChart() {
  if (distDonutChart) { distDonutChart.destroy(); distDonutChart = null }
  if (!distDonutContainer.value) return

  distDonutChart = new Chart({
    container: distDonutContainer.value,
    autoFit: true,
    height: 220,
    padding: [10, 10, 28, 10],
  })

  distDonutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })

  distDonutChart.data(distDonutData)

  distDonutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: ['#007BFF', '#69C0FF', '#52C41A', '#FA8C16'] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)

  distDonutChart.label({
    text: (d) => `${d.name}\n${d.value.toLocaleString()}`,
    position: 'outside',
    connector: true,
    connectorStroke: '#ccc',
    connectorLineWidth: 1,
    fontSize: 11,
    labelLine: true,
  })

  distDonutChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })

  distDonutChart.render()
}

const mainDonutContainer = ref(null)
let mainDonutChart = null

const trendSingleContainer = ref(null)
let trendSingleChart = null
const trendDetailSearch = ref('')
const trendDetailPage = ref(1)

const trendSingleData = [
  { day: '5月15', value: 45 },
  { day: '5月16', value: 52 },
  { day: '5月17', value: 38 },
  { day: '5月18', value: 65 },
  { day: '5月19', value: 48 },
  { day: '5月20', value: 35 },
  { day: '5月21', value: 42 },
]

const resourceTrendData = [
  { day: '5月15', value: 1210000 },
  { day: '5月16', value: 1218000 },
  { day: '5月17', value: 1225000 },
  { day: '5月18', value: 1222000 },
  { day: '5月19', value: 1230000 },
  { day: '5月20', value: 1234000 },
  { day: '5月21', value: 1234567 },
]
const resourceTrendContainer = ref(null)
let resourceTrendChart = null

const trendDetailColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
]

const trendDetailData = [
  { name: 'mysql-01', type: 'MySQL', status: '警告', updateTime: '2024-01-15 10:15', desc: '连接数超限' },
  { name: 'redis-01', type: 'Redis', status: '警告', updateTime: '2024-01-15 09:58', desc: '内存使用率过高' },
  { name: 'k8s-node-03', type: 'K8s', status: '严重', updateTime: '2024-01-15 09:45', desc: '节点离线' },
]

const filteredTrendDetailData = computed(() => {
  if (!trendDetailSearch.value) return trendDetailData
  const q = trendDetailSearch.value.toLowerCase()
  return trendDetailData.filter(item =>
    item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  )
})

const handleTrendDetailTableChange = (pag) => {
  trendDetailPage.value = pag.current
}

function renderTrendSingleChart() {
  if (trendSingleChart) { trendSingleChart.destroy(); trendSingleChart = null }
  if (!trendSingleContainer.value) return

  trendSingleChart = new Chart({
    container: trendSingleContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 32, 20],
  })

  trendSingleChart.data(trendSingleData)

  trendSingleChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')

  trendSingleChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')

  trendSingleChart.point()
    .encode('x', 'day')
    .encode('y', 'value')

  trendSingleChart.render()
}

function renderResourceTrendChart() {
  if (resourceTrendChart) { resourceTrendChart.destroy(); resourceTrendChart = null }
  if (!resourceTrendContainer.value) return

  resourceTrendChart = new Chart({
    container: resourceTrendContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 20, 20],
  })

  resourceTrendChart.data(resourceTrendData)

  resourceTrendChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')

  resourceTrendChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')

  resourceTrendChart.point()
    .encode('x', 'day')
    .encode('y', 'value')

  resourceTrendChart.render()
}

function renderMainDonutChart() {
  if (mainDonutChart) { mainDonutChart.destroy(); mainDonutChart = null }
  if (!mainDonutContainer.value) return

  mainDonutChart = new Chart({
    container: mainDonutContainer.value,
    autoFit: true,
    height: 220,
    padding: [10, 10, 28, 10],
  })

  mainDonutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })

  mainDonutChart.data(resourceDist.map(d => ({ name: d.name, value: d.percent })))

  mainDonutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: ['#007BFF', '#69C0FF', '#52C41A', '#FA8C16'] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)

  mainDonutChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })

  mainDonutChart.render()
}

watch(detailPanelOpen, (val) => {
  if (val) {
    detailPeriod.value = 'week'
    detailSearch.value = ''
    detailPage.value = 1
    alertDetailSearch.value = ''
    alertDetailPage.value = 1
    nextTick(() => {
      if (detailType.value === 'resource') renderResourceTrendChart()
      else if (detailType.value === 'health') renderHealthTrendChart()
      else if (detailType.value === 'alert') renderAlertDetailChart()
      else if (detailType.value === 'event') renderEventDetailChart()
      else if (detailType.value === 'distribution') renderDistDonutChart()
      else if (detailType.value === 'trend') renderTrendSingleChart()
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
  } else if (card.title === '今日事件') {
    detailType.value = 'event'
  }
  detailPanelOpen.value = true
}

const closeDetailPanel = () => {
  detailPanelOpen.value = false
  alertEventRecord.value = null
}

const openAlertEventDetail = (record) => {
  alertEventRecord.value = record
  detailPanelOpen.value = true
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
    height: 220,
    padding: [20, 20, 20, 20],
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

  alertTrendChart.render()
}

onMounted(() => {
  renderAlertTrendChart()
  renderMainDonutChart()
})

onBeforeUnmount(() => {
  if (alertTrendChart) { alertTrendChart.destroy(); alertTrendChart = null }
  if (healthTrendChart) { healthTrendChart.destroy(); healthTrendChart = null }
  if (alertDetailChart) { alertDetailChart.destroy(); alertDetailChart = null }
  if (eventDetailChart) { eventDetailChart.destroy(); eventDetailChart = null }
  if (distDonutChart) { distDonutChart.destroy(); distDonutChart = null }
  if (trendSingleChart) { trendSingleChart.destroy(); trendSingleChart = null }
  if (resourceTrendChart) { resourceTrendChart.destroy(); resourceTrendChart = null }
  if (mainDonutChart) { mainDonutChart.destroy(); mainDonutChart = null }
})

const refreshCard = (card) => {
  message.success(`刷新 ${card.title} 数据`)
}
</script>

<style scoped>
.home-view { padding: 24px; min-height: 100%; }
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

.line-chart { position: relative; height: 220px; min-height: 220px; }
.health-trend-chart { height: 180px; min-height: 180px; }
.alert-trend-chart { height: 180px; min-height: 180px; }
.event-trend-chart { height: 180px; min-height: 180px; }
.dist-donut-chart { height: 220px; min-height: 220px; }
.main-donut-chart { height: 220px; min-height: 220px; }
.trend-single-chart { height: 180px; min-height: 180px; }
.alert-summary-card { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 20px; }
.alert-event-name { font-size: 18px; font-weight: 600; color: #1a1a1a; flex: 1; }
.alert-event-time { font-size: 13px; color: #8c8c8c; }
.ci-info-table { border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.ci-row { display: grid; grid-template-columns: 80px 1fr 80px 1fr; border-bottom: 1px solid #f5f5f5; }
.ci-row:last-child { border-bottom: none; }
.ci-label { padding: 10px 12px; font-size: 12px; color: #8c8c8c; background: #fafafa; }
.ci-value { padding: 10px 12px; font-size: 13px; color: #1a1a1a; }
.timeline-section { margin-bottom: 20px; }
.timeline-section h4 { margin: 0 0 16px; font-size: 14px; font-weight: 600; }
.timeline { position: relative; padding-left: 24px; }
.timeline-item { position: relative; padding-bottom: 24px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { position: absolute; left: -24px; top: 2px; width: 12px; height: 12px; border-radius: 50%; z-index: 1; }
.timeline-dot.red { background: #f5222d; }
.timeline-dot.yellow { background: #fa8c16; }
.timeline-line { position: absolute; left: -19px; top: 14px; bottom: 0; width: 2px; background: #e8e8e8; }
.timeline-item:last-child .timeline-line { display: none; }
.timeline-content { display: flex; flex-direction: column; gap: 4px; }
.timeline-time { font-size: 12px; color: #8c8c8c; }
.timeline-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.timeline-operator { font-size: 12px; color: #8c8c8c; }
.timeline-note { font-size: 13px; color: #595959; }
.line-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

.chart-card { min-height: 270px; }
.chart-card :deep(.ant-card-body) { height: calc(100% - 57px); display: flex; flex-direction: column; justify-content: center; }
.table-card :deep(.ant-card-head-title) { font-weight: 600; }
.table-card :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.status-处理中 { color: #8c8c8c; }
.status-已恢复, .status-已处理 { color: #52C41A; }

@media (max-width: 768px) {
  .home-view { padding: 12px; }
  .welcome-bar { margin-bottom: 16px; }
  .welcome-text h2 { font-size: 16px; }
  .welcome-text p { font-size: 12px; }
  .kpi-card { padding: 12px 14px; min-height: 80px; }
  .card-header { margin-bottom: 8px; }
  .card-icon { width: 28px; height: 28px; font-size: 13px; }
  .card-title { font-size: 12px; }
  .card-actions { opacity: 1; }
  .card-value .value { font-size: 20px; }
  .trend { font-size: 11px; }
  .card-sub { font-size: 11px; min-height: 14px; }
  .chart-card { min-height: 220px; }
  .chart-card :deep(.ant-card-body) { padding: 12px; }
  .chart-actions { opacity: 1; }
  .donut-chart { flex-direction: column; }
  .donut-legend { flex-direction: row; flex-wrap: wrap; }
  .donut-ring { width: 120px; height: 120px; }
  .donut-center .total { font-size: 16px; }
  .line-chart { height: 160px; min-height: 160px; }
  .health-trend-chart { height: 140px; min-height: 140px; }
  .alert-trend-chart { height: 140px; min-height: 140px; }
  .event-trend-chart { height: 140px; min-height: 140px; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-body { padding: 12px; }
  .detail-header { padding: 12px 14px; }
  .detail-header h3 { font-size: 14px; }
  .detail-header .close-btn { padding: 8px 12px; font-size: 18px; }
  .detail-kpi { padding: 12px; gap: 8px; }
  .dk-value { font-size: 16px; }
  .time-tabs :deep(.ant-radio-button-wrapper) { font-size: 11px; padding: 0 4px; }
  .ci-row { grid-template-columns: 70px 1fr 70px 1fr; }
  .ci-label { font-size: 11px; padding: 8px 10px; }
  .ci-value { font-size: 12px; padding: 8px 10px; }
  .alert-summary-card { flex-wrap: wrap; gap: 6px; }
  .alert-summary-card .alert-event-name { flex: 0 0 100%; order: 1; }
  .alert-summary-card .alert-event-time { flex: 0 0 100%; order: 2; }
  .timeline-content { font-size: 12px; }
  .timeline-title { font-size: 13px; }
  .detail-footer { flex-direction: column; gap: 8px; padding: 12px 14px; }
  .detail-footer > div:first-child { display: none; }
  .footer-actions { width: 100%; }
  .footer-actions button { flex: 1; }
}

@media (max-width: 576px) {
  .home-view { padding: 8px; }
  .kpi-card { padding: 10px 12px; min-height: 70px; }
  .card-value .value { font-size: 18px; }
  .card-icon { width: 24px; height: 24px; font-size: 11px; }
  .detail-search { width: 100% !important; }
  .detail-panel-content { right: -100%; }
  .detail-table :deep(.ant-table) { overflow-x: auto; }
  .detail-table :deep(.ant-table-body) { overflow-x: auto !important; }
  .ci-row { grid-template-columns: 1fr; gap: 0; }
  .ci-label { padding: 8px 10px 2px; }
  .ci-value { padding: 2px 10px 8px; }
  .ci-label:empty, .ci-value:empty { display: none; }
}

@media (max-width: 480px) {
  .detail-kpi { grid-template-columns: 1fr; }
  .detail-panel-content { right: -100%; }
}

.detail-panel {
  position: fixed;
  top: 48px;
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
.dk-value.down { color: #f5222d; }

.detail-table h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.table-toolbar { margin-bottom: 12px; }
.detail-search { width: 200px; }
.detail-table :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.detail-table :deep(.ant-pagination) { margin-top: 12px; }
.bar-cell { display: flex; align-items: center; gap: 6px; }
.bar-cell-inline { gap: 8px; }
.bar-bg { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; min-width: 100px; }
.bar-bg-sm { height: 14px; min-width: 80px; border-radius: 7px; }
.bar-fill { height: 100%; background: #1890ff; border-radius: 5px; }
.bar-bg-sm .bar-fill { border-radius: 7px; }
.health-good { color: #52C41A; }
.health-warn { color: #fa8c16; }
.health-bad { color: #f5222d; }
.num-up { color: #52C41A; }
.num-down { color: #f5222d; }
.trend-up { color: #f5222d; font-weight: 500; }
.trend-down { color: #52C41A; font-weight: 500; }
.trend-stable { color: #fa8c16; font-weight: 500; }

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