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
              <a-button type="text" size="small" class="action-btn" @click.stop="refreshCard(card)">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu @click="({key}) => handleCardAction(card, key)">
                    <a-menu-item key="detail"><i class="fa-solid fa-eye"></i> 查看详情</a-menu-item>
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
            <a-button type="text" size="small" class="refresh-btn">
              <i class="fa-solid fa-rotate-right"></i>
            </a-button>
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
            <a-button type="text" size="small" class="refresh-btn">
              <i class="fa-solid fa-rotate-right"></i>
            </a-button>
          </template>
          <div class="line-chart">
            <svg class="area-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#ff4d4f;stop-opacity:0.3"/>
                  <stop offset="100%" style="stop-color:#ff4d4f;stop-opacity:0.05"/>
                </linearGradient>
              </defs>
              <path class="area-fill" d="M0,128 L57,108 L114,98 L171,52 L228,88 L285,78 L342,96 L400,104 L400,160 L0,160 Z" fill="url(#areaGradient)"/>
              <path class="line-path" d="M0,128 L57,108 L114,98 L171,52 L228,88 L285,78 L342,96 L400,104" fill="none" stroke="#ff4d4f" stroke-width="2.5"/>
              <circle cx="0" cy="128" r="4" fill="#ff4d4f"/>
              <circle cx="57" cy="108" r="4" fill="#ff4d4f"/>
              <circle cx="114" cy="98" r="4" fill="#ff4d4f"/>
              <circle cx="171" cy="52" r="4" fill="#ff4d4f"/>
              <circle cx="228" cy="88" r="4" fill="#ff4d4f"/>
              <circle cx="285" cy="78" r="4" fill="#ff4d4f"/>
              <circle cx="342" cy="96" r="4" fill="#ff4d4f"/>
              <circle cx="400" cy="104" r="4" fill="#ff4d4f"/>
            </svg>
            <div class="line-labels">
              <span>周一</span>
              <span>周二</span>
              <span>周三</span>
              <span>周四</span>
              <span>周五</span>
              <span>周六</span>
              <span>周日</span>
            </div>
          </div>
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
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { message } from 'ant-design-vue'

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

const refreshCard = (card) => {
  message.success(`刷新 ${card.title} 数据`)
}

const handleCardAction = (card, key) => {
  const actions = {
    detail: '查看详情',
    export: '导出数据',
    history: '历史趋势',
  }
  message.info(`${card.title} - ${actions[key]}`)
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
.refresh-btn { color: #1890ff; }

.donut-chart { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 20px 0; }
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

.line-chart { position: relative; display: flex; flex-direction: column; justify-content: center; height: 100%; min-height: 172px; }
.area-svg { width: 100%; height: 172px; }
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
</style>