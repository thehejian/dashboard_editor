<template>
  <div class="home-view">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <div class="welcome-bar">
          <div class="welcome-text">
            <h2>欢迎回来，管理员</h2>
            <p>这里是今天的系统概览</p>
          </div>
          <a-dropdown>
            <a-button>
              最近访问 <i class="fa-solid fa-chevron-down"></i>
            </a-button>
            <template #overlay>
              <a-menu @click="({key}) => $router.push(key)">
                <a-menu-item key="/monitor/dashboard"><i class="fa-solid fa-chart-line"></i> 监控中心</a-menu-item>
                <a-menu-item key="/alarm/realtime"><i class="fa-solid fa-bell"></i> 告警中心</a-menu-item>
                <a-menu-item key="/resource/list"><i class="fa-solid fa-database"></i> 资源中心</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-col>

      <a-col :xs="12" :sm="12" :md="6" v-for="stat in statCards" :key="stat.title">
        <a-card class="stat-card" hoverable @click="stat.onClick">
          <div class="stat-content">
            <div class="stat-header">
              <a-badge :dot="stat.dot" :dotColor="stat.color">
                <div class="stat-icon" :style="{ background: stat.bgColor }">
                  <i :class="stat.icon" :style="{ color: stat.color }"></i>
                </div>
              </a-badge>
              <span class="stat-title">{{ stat.title }}</span>
            </div>
            <div class="stat-value">
              <span class="value">{{ stat.value }}</span>
              <span class="suffix" v-if="stat.suffix">{{ stat.suffix }}</span>
            </div>
            <div class="stat-footer" v-if="stat.trend || stat.sub">
              <span v-if="stat.trend" :class="stat.trend > 0 ? 'up' : 'down'">
                <i :class="stat.trend > 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
                {{ Math.abs(stat.trend) }}
              </span>
              <span class="sub" v-if="stat.sub">{{ stat.sub }}</span>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="16" :lg="16" :md="16" :sm="24" :xs="24">
        <a-card title="告警趋势" class="chart-card">
          <template #extra>
            <a-radio-group v-model:value="alertPeriod" size="small">
              <a-radio-button value="7d">近7天</a-radio-button>
              <a-radio-button value="30d">近30天</a-radio-button>
            </a-radio-group>
          </template>
          <div class="trend-chart">
            <div class="chart-bars">
              <div class="bar-item" v-for="(v, i) in alertTrend" :key="i">
                <div class="bar" :style="{ height: v + '%' }"></div>
                <span class="label">{{ i + 1 }}日</span>
              </div>
            </div>
            <div class="chart-legend">
              <span><i class="dot critical"></i> 紧急 {{ alertSummary.critical }}</span>
              <span><i class="dot warning"></i> 重要 {{ alertSummary.warning }}</span>
              <span><i class="dot info"></i> 次要 {{ alertSummary.info }}</span>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="8" :lg="8" :md="8" :sm="24" :xs="24">
        <a-card title="健康状态" class="health-card">
          <div class="health-ring">
            <a-progress type="circle" :percent="98" :width="120" :strokeColor=" '#52c41a'" :trailColor="'#f0f0f0'" />
            <div class="health-text">
              <div class="value">98%</div>
              <div class="label">整体健康</div>
            </div>
          </div>
          <div class="health-detail">
            <div class="detail-item">
              <span class="dot green"></span>
              <span>正常 {{ healthDetail.normal }}</span>
            </div>
            <div class="detail-item">
              <span class="dot orange"></span>
              <span>警告 {{ healthDetail.warning }}</span>
            </div>
            <div class="detail-item">
              <span class="dot red"></span>
              <span>异常 {{ healthDetail.error }}</span>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card title="资源分布" class="dist-card">
          <div class="dist-list">
            <div class="dist-item" v-for="item in resourceDist" :key="item.name">
              <div class="dist-info">
                <span class="name">{{ item.name }}</span>
                <span class="count">{{ item.count }} 台</span>
              </div>
              <div class="dist-bar">
                <a-progress :percent="item.percent" :showInfo="false" :strokeColor="item.color" :strokeWidth="8" />
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card title="快速入口" class="links-card">
          <div class="link-grid">
            <div class="link-item" v-for="link in quickLinks" :key="link.path" @click="$router.push(link.path)">
              <div class="link-icon" :style="{ background: link.bgColor }">
                <i :class="link.icon" :style="{ color: link.color }"></i>
              </div>
              <span class="link-name">{{ link.name }}</span>
            </div>
          </div>
          <a-divider />
          <div class="collections">
            <span class="col-label">收藏</span>
            <a-tag v-for="col in collections" :key="col" color="blue">{{ col }}</a-tag>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="16" :lg="16" :md="16" :sm="24" :xs="24">
        <a-card title="最近告警">
          <template #extra>
            <a-button type="link" @click="$router.push('/alarm/realtime')">查看全部</a-button>
          </template>
          <div class="alert-list">
            <div class="alert-item" v-for="alert in recentAlerts" :key="alert.id" :class="alert.level">
              <div class="alert-icon">
                <i :class="getAlertIcon(alert.level)"></i>
              </div>
              <div class="alert-body">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-meta">{{ alert.resource }} · {{ alert.time }}</div>
              </div>
              <a-tag :color="getLevelColor(alert.level)">{{ getLevelText(alert.level) }}</a-tag>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :xl="8" :lg="8" :md="8" :sm="24" :xs="24">
        <a-card title="待办事项">
          <div class="todo-list">
            <div class="todo-item" v-for="item in todos" :key="item.id">
              <div class="todo-icon" :class="item.type">
                <i :class="getTodoIcon(item.type)"></i>
              </div>
              <div class="todo-body">
                <div class="todo-title">{{ item.title }}</div>
                <div class="todo-desc">{{ item.desc }}</div>
              </div>
              <div class="todo-count">{{ item.count }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const alertPeriod = ref('7d')

const statCards = reactive([
  { title: '资源总数', value: '156', suffix: '台', trend: 5, sub: '较昨日', icon: 'fa-solid fa-server', color: '#1890ff', bgColor: '#e6f7ff', onClick: () => {} },
  { title: '活跃告警', value: '12', dot: true, dotColor: '#f5222d', sub: '紧急3 重要5', icon: 'fa-solid fa-bell', color: '#f5222d', bgColor: '#fff1f0', onClick: () => {} },
  { title: '健康状态', value: '98', suffix: '%', icon: 'fa-solid fa-heart-pulse', color: '#52c41a', bgColor: '#f6ffed', onClick: () => {} },
  { title: '待办事项', value: '5', sub: '告警3 续费2', icon: 'fa-solid fa-list-check', color: '#fa8c16', bgColor: '#fff7e6', onClick: () => {} },
])

const alertTrend = ref([45, 60, 35, 80, 55, 70, 90])
const alertSummary = reactive({ critical: 5, warning: 15, info: 22 })

const healthDetail = reactive({ normal: 142, warning: 10, error: 4 })

const resourceDist = reactive([
  { name: '业务应用', count: 45, percent: 45, color: '#1890ff' },
  { name: '云服务', count: 30, percent: 30, color: '#722ed1' },
  { name: '云资源', count: 15, percent: 15, color: '#52c41a' },
  { name: '物理资源', count: 10, percent: 10, color: '#fa8c16' },
])

const quickLinks = ref([
  { name: '监控中心', icon: 'fa-solid fa-chart-line', color: '#1890ff', bgColor: '#e6f7ff', path: '/monitor/dashboard' },
  { name: '告警中心', icon: 'fa-solid fa-bell', color: '#f5222d', bgColor: '#fff1f0', path: '/alarm/realtime' },
  { name: '资源中心', icon: 'fa-solid fa-database', color: '#52c41a', bgColor: '#f6ffed', path: '/resource/list' },
  { name: '运维中心', icon: 'fa-solid fa-terminal', color: '#722ed1', bgColor: '#f9f0ff', path: '/ops/jobs' },
])

const collections = ref(['云服务器', '数据库', 'Kubernetes'])

const recentAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001', time: '10:32' },
  { id: 2, level: 'warning', title: '磁盘空间不足', resource: 'db-primary', time: '09:15' },
  { id: 3, level: 'info', title: '内存使用率偏高', resource: 'app-server-03', time: '08:45' },
])

const todos = ref([
  { id: 1, type: 'alert', title: '待处理告警', desc: '需要及时处理', count: 3 },
  { id: 2, type: 'renew', title: '待续费资源', desc: '即将到期', count: 2 },
])

const getAlertIcon = (level) => ({
  critical: 'fa-solid fa-circle-exclamation',
  warning: 'fa-solid fa-triangle-exclamation',
  info: 'fa-solid fa-circle-info'
}[level])
const getLevelColor = (level) => ({ critical: 'red', warning: 'orange', info: 'blue' }[level])
const getLevelText = (level) => ({ critical: '紧急', warning: '重要', info: '次要' }[level])
const getTodoIcon = (type) => ({ alert: 'fa-solid fa-bell', renew: 'fa-solid fa-credit-card' }[type])
</script>

<style scoped>
.home-view { padding: 24px; min-height: 100%; }
.welcome-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.welcome-text h2 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
.welcome-text p { color: var(--text-secondary); margin: 0; }

.stat-card { height: 100%; }
.stat-card :deep(.ant-card-body) { padding: 20px; }
.stat-content { display: flex; flex-direction: column; gap: 12px; }
.stat-header { display: flex; align-items: center; gap: 8px; }
.stat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.stat-title { font-size: 14px; color: var(--text-secondary); }
.stat-value { display: flex; align-items: baseline; gap: 4px; }
.stat-value .value { font-size: 28px; font-weight: 600; }
.stat-value .suffix { font-size: 14px; color: var(--text-secondary); }
.stat-footer { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.stat-footer .up { color: #52c41a; }
.stat-footer .down { color: #f5222d; }
.stat-footer .sub { color: var(--text-secondary); }

.chart-card :deep(.ant-card-body) { padding: 20px; }
.trend-chart { display: flex; flex-direction: column; gap: 16px; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 100px; }
.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.bar { width: 100%; background: linear-gradient(180deg, #1890ff 0%, #69c0ff 100%); border-radius: 4px 4px 0 0; min-height: 4px; }
.chart-bars .label { font-size: 11px; color: var(--text-secondary); }
.chart-legend { display: flex; justify-content: center; gap: 24px; font-size: 13px; }
.chart-legend .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.chart-legend .critical { background: #f5222d; }
.chart-legend .warning { background: #fa8c16; }
.chart-legend .info { background: #1890ff; }

.health-card :deep(.ant-card-body) { padding: 20px; }
.health-ring { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; }
.health-text { text-align: center; }
.health-text .value { font-size: 28px; font-weight: 600; color: #52c41a; }
.health-text .label { font-size: 13px; color: var(--text-secondary); }
.health-detail { display: flex; justify-content: space-around; }
.health-detail .detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.health-detail .dot { width: 8px; height: 8px; border-radius: 50%; }
.health-detail .green { background: #52c41a; }
.health-detail .orange { background: #fa8c16; }
.health-detail .red { background: #f5222d; }

.dist-card :deep(.ant-card-body) { padding: 20px; }
.dist-list { display: flex; flex-direction: column; gap: 16px; }
.dist-item { display: flex; flex-direction: column; gap: 8px; }
.dist-info { display: flex; justify-content: space-between; font-size: 13px; }
.dist-info .name { font-weight: 500; }
.dist-info .count { color: var(--text-secondary); }

.links-card :deep(.ant-card-body) { padding: 20px; }
.link-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.link-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.link-item:hover { background: var(--bg-sec); }
.link-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.link-name { font-size: 12px; }
.collections { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.col-label { font-size: 13px; color: var(--text-secondary); }

.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bg-sec); }
.alert-item.critical { border-left: 3px solid #f5222d; }
.alert-item.warning { border-left: 3px solid #fa8c16; }
.alert-item.info { border-left: 3px solid #1890ff; }
.alert-item .alert-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.alert-item.critical .alert-icon { background: #fff1f0; color: #f5222d; }
.alert-item.warning .alert-icon { background: #fff7e6; color: #fa8c16; }
.alert-item.info .alert-icon { background: #e6f7ff; color: #1890ff; }
.alert-item .alert-body { flex: 1; }
.alert-item .alert-title { font-size: 13px; font-weight: 500; }
.alert-item .alert-meta { font-size: 12px; color: var(--text-secondary); }

.todo-list { display: flex; flex-direction: column; gap: 12px; }
.todo-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bg-sec); }
.todo-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.todo-icon.alert { background: #fff1f0; color: #f5222d; }
.todo-icon.renew { background: #fff7e6; color: #fa8c16; }
.todo-body { flex: 1; }
.todo-title { font-size: 13px; font-weight: 500; }
.todo-desc { font-size: 12px; color: var(--text-secondary); }
.todo-count { font-size: 24px; font-weight: 600; }

@media (max-width: 768px) { .link-grid { grid-template-columns: repeat(2, 1fr); } }
</style>