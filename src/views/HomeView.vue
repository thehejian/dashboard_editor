<template>
  <div class="home-view">
    <div class="home-header">
      <div class="welcome">
        <h1>欢迎回来，管理员</h1>
        <p class="subtitle">这里是今天的系统概览</p>
      </div>
      <div class="recent-access">
        <span class="label">最近访问</span>
        <a-dropdown>
          <span class="recent-item">
            <i class="fa-solid fa-chart-line"></i> 监控中心
            <i class="fa-solid fa-chevron-down"></i>
          </span>
          <template #overlay>
            <a-menu>
              <a-menu-item v-for="item in recentList" :key="item.path" @click="$router.push(item.path)">
                <i :class="item.icon"></i> {{ item.name }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card" @click="$router.push('/resource/list')">
        <div class="stat-icon resources"><i class="fa-solid fa-server"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalResources }}</div>
          <div class="stat-label">资源总数</div>
          <div class="stat-trend up" v-if="stats.resourceChange > 0">↑ {{ stats.resourceChange }}</div>
        </div>
      </div>
      <div class="stat-card alert-card" @click="$router.push('/alarm/realtime')">
        <div class="stat-icon alerts"><i class="fa-solid fa-bell"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeAlerts }}</div>
          <div class="stat-label">活跃告警</div>
          <div class="stat-breakdown">
            <span class="critical">{{ stats.critical }} 紧急</span>
            <span class="warning">{{ stats.warning }} 重要</span>
          </div>
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/monitor/resource')">
        <div class="stat-icon health"><i class="fa-solid fa-heart-pulse"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.healthRate }}%</div>
          <div class="stat-label">健康状态</div>
          <div class="stat-status normal">正常运行</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon todo"><i class="fa-solid fa-list-check"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todoCount }}</div>
          <div class="stat-label">待办事项</div>
          <div class="stat-breakdown">
            <span>告警 {{ stats.todoAlerts }}</span>
            <span>续费 {{ stats.todoRenew }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="section-header">
        <h3>告警趋势</h3>
        <div class="time-selector">
          <button :class="{ active: alertPeriod === '7d' }" @click="alertPeriod = '7d'">近7天</button>
          <button :class="{ active: alertPeriod === '30d' }" @click="alertPeriod = '30d'">近30天</button>
        </div>
      </div>
      <div class="trend-chart">
        <div class="chart-bars">
          <div class="bar-group" v-for="(value, index) in alertTrend" :key="index">
            <div class="bar" :style="{ height: value + '%' }"></div>
            <span class="bar-label">{{ index + 1 }}日</span>
          </div>
        </div>
        <div class="chart-summary">
          <div class="summary-item">
            <span class="dot critical"></span>
            <span>紧急 {{ alertSummary.critical }}</span>
          </div>
          <div class="summary-item">
            <span class="dot warning"></span>
            <span>重要 {{ alertSummary.warning }}</span>
          </div>
          <div class="summary-item">
            <span class="dot info"></span>
            <span>次要 {{ alertSummary.info }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="grid-left">
        <div class="resource-distribution">
          <div class="section-header">
            <h3>资源分布</h3>
          </div>
          <div class="distribution-list">
            <div class="dist-item" v-for="item in resourceDist" :key="item.name">
              <div class="dist-info">
                <span class="dist-name">{{ item.name }}</span>
                <span class="dist-count">{{ item.count }}</span>
              </div>
              <div class="dist-bar">
                <div class="dist-progress" :style="{ width: item.percent + '%', background: item.color }"></div>
              </div>
              <span class="dist-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>

        <div class="recent-alerts">
          <div class="section-header">
            <h3>最近告警</h3>
            <a-button type="link" @click="$router.push('/alarm/realtime')">查看全部 <i class="fa-solid fa-arrow-right"></i></a-button>
          </div>
          <div class="alert-list">
            <div class="alert-item" v-for="alert in recentAlerts" :key="alert.id" :class="alert.level">
              <div class="alert-icon">
                <i class="fa-solid" :class="{
                  'fa-circle-exclamation': alert.level === 'critical',
                  'fa-triangle-exclamation': alert.level === 'warning',
                  'fa-circle-info': alert.level === 'info'
                }"></i>
              </div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-meta">{{ alert.resource }} · {{ alert.time }}</div>
              </div>
              <a-tag :color="getLevelColor(alert.level)">{{ getLevelText(alert.level) }}</a-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-right">
        <div class="quick-links">
          <div class="section-header">
            <h3>快速入口</h3>
          </div>
          <div class="link-items">
            <div class="link-item" v-for="link in quickLinks" :key="link.path" @click="$router.push(link.path)">
              <i :class="link.icon" :style="{ color: link.color }"></i>
              <span>{{ link.name }}</span>
            </div>
          </div>
          <div class="collections">
            <div class="collection-header">收藏</div>
            <div class="collection-list">
              <span class="collection-tag" v-for="col in collections" :key="col">{{ col }}</span>
            </div>
          </div>
        </div>

        <div class="todo-list">
          <div class="section-header">
            <h3>待办事项</h3>
          </div>
          <div class="todo-items">
            <div class="todo-item" v-for="item in todos" :key="item.id">
              <div class="todo-icon" :class="item.type">
                <i class="fa-solid" :class="{
                  'fa-bell': item.type === 'alert',
                  'fa-credit-card': item.type === 'renew',
                  'fa-gear': item.type === 'config'
                }"></i>
              </div>
              <div class="todo-content">
                <div class="todo-title">{{ item.title }}</div>
                <div class="todo-desc">{{ item.desc }}</div>
              </div>
              <span class="todo-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const alertPeriod = ref('7d')

const stats = reactive({
  totalResources: 156,
  resourceChange: 5,
  activeAlerts: 12,
  critical: 3,
  warning: 5,
  healthRate: 98,
  todoCount: 5,
  todoAlerts: 3,
  todoRenew: 2
})

const alertTrend = ref([45, 60, 35, 80, 55, 70, 90, 65, 50, 75, 40, 60])

const alertSummary = reactive({ critical: 5, warning: 15, info: 22 })

const resourceDist = ref([
  { name: '业务应用', count: 45, percent: 45, color: '#1890ff' },
  { name: '云服务', count: 30, percent: 30, color: '#722ed1' },
  { name: '云资源', count: 15, percent: 15, color: '#52c41a' },
  { name: '物理资源', count: 10, percent: 10, color: '#fa8c16' }
])

const recentAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001', time: '10:32' },
  { id: 2, level: 'warning', title: '磁盘空间不足', resource: 'db-primary', time: '09:15' },
  { id: 3, level: 'info', title: '内存使用率偏高', resource: 'app-server-03', time: '08:45' }
])

const recentList = ref([
  { name: '监控中心', icon: 'fa-solid fa-chart-line', path: '/monitor/dashboard' },
  { name: '告警中心', icon: 'fa-solid fa-bell', path: '/alarm/realtime' },
  { name: '资源中心', icon: 'fa-solid fa-database', path: '/resource/list' }
])

const quickLinks = ref([
  { name: '监控中心', icon: 'fa-solid fa-chart-line', path: '/monitor/dashboard', color: '#1890ff' },
  { name: '告警中心', icon: 'fa-solid fa-bell', path: '/alarm/realtime', color: '#f5222d' },
  { name: '资源中心', icon: 'fa-solid fa-database', path: '/resource/list', color: '#52c41a' },
  { name: '运维中心', icon: 'fa-solid fa-terminal', path: '/ops/jobs', color: '#722ed1' }
])

const collections = ref(['云服务器', '数据库', 'Kubernetes'])

const todos = ref([
  { id: 1, type: 'alert', title: '待处理告警', desc: '需要及时处理', count: 3 },
  { id: 2, type: 'renew', title: '待续费资源', desc: '即将到期', count: 2 },
  { id: 3, type: 'config', title: '配置提醒', desc: '待处理配置', count: 0 }
])

const getLevelColor = (level) => ({ critical: 'red', warning: 'orange', info: 'blue' }[level])
const getLevelText = (level) => ({ critical: '紧急', warning: '重要', info: '次要' }[level])
</script>

<style scoped>
.home-view { padding: 24px; max-width: 1400px; margin: 0 auto; }

.home-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.welcome h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px; }
.subtitle { color: var(--text-secondary); margin: 0; }
.recent-access { display: flex; align-items: center; gap: 8px; }
.recent-access .label { font-size: 13px; color: var(--text-secondary); }
.recent-item { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; background: var(--bg-card); border-radius: 6px; font-size: 13px; }

.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg-card); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.stat-icon.resources { background: #e6f7ff; color: #1890ff; }
.stat-icon.alerts { background: #fff1f0; color: #f5222d; }
.stat-icon.health { background: #f6ffed; color: #52c41a; }
.stat-icon.todo { background: #fff7e6; color: #fa8c16; }
.stat-value { font-size: 28px; font-weight: 600; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-trend { font-size: 12px; }
.stat-trend.up { color: #52c41a; }
.stat-breakdown { font-size: 12px; color: var(--text-secondary); display: flex; gap: 8px; }
.stat-breakdown .critical { color: #f5222d; }
.stat-breakdown .warning { color: #fa8c16; }
.stat-status { font-size: 12px; color: #52c41a; }

.chart-section { background: var(--bg-card); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
.time-selector { display: flex; gap: 4px; }
.time-selector button { padding: 4px 12px; font-size: 12px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; }
.time-selector button.active { background: var(--brand); color: #fff; }
.trend-chart { display: flex; gap: 24px; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; flex: 1; }
.bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.bar { width: 100%; background: var(--brand); border-radius: 4px 4px 0 0; min-height: 4px; }
.bar-label { font-size: 11px; color: var(--text-secondary); }
.chart-summary { display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.summary-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.summary-item .dot { width: 8px; height: 8px; border-radius: 50%; }
.summary-item .dot.critical { background: #f5222d; }
.summary-item .dot.warning { background: #fa8c16; }
.summary-item .dot.info { background: #1890ff; }

.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.grid-left, .grid-right { display: flex; flex-direction: column; gap: 24px; }

.resource-distribution, .recent-alerts, .quick-links, .todo-list { background: var(--bg-card); border-radius: 12px; padding: 20px; }
.dist-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.dist-info { width: 100px; display: flex; justify-content: space-between; }
.dist-name { font-size: 13px; }
.dist-count { color: var(--text-secondary); font-size: 12px; }
.dist-bar { flex: 1; height: 8px; background: var(--bg-sec); border-radius: 4px; overflow: hidden; }
.dist-progress { height: 100%; border-radius: 4px; }
.dist-percent { width: 40px; text-align: right; font-size: 12px; color: var(--text-secondary); }

.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-sec); border-radius: 8px; }
.alert-item.critical { border-left: 3px solid #f5222d; }
.alert-item.warning { border-left: 3px solid #fa8c16; }
.alert-item.info { border-left: 3px solid #1890ff; }
.alert-item .alert-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.alert-item.critical .alert-icon { background: #fff1f0; color: #f5222d; }
.alert-item.warning .alert-icon { background: #fff7e6; color: #fa8c16; }
.alert-item.info .alert-icon { background: #e6f7ff; color: #1890ff; }
.alert-item .alert-content { flex: 1; }
.alert-item .alert-title { font-size: 13px; font-weight: 500; }
.alert-item .alert-meta { font-size: 12px; color: var(--text-secondary); }

.link-items { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.link-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; background: var(--bg-sec); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
.link-item:hover { background: var(--brand-subtle); }
.link-item i { font-size: 24px; }
.link-item span { font-size: 13px; }
.collection-header { font-size: 13px; font-weight: 500; margin-bottom: 8px; }
.collection-list { display: flex; flex-wrap: wrap; gap: 8px; }
.collection-tag { padding: 4px 12px; background: var(--bg-sec); border-radius: 16px; font-size: 12px; color: var(--text-secondary); }

.todo-items { display: flex; flex-direction: column; gap: 12px; }
.todo-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-sec); border-radius: 8px; }
.todo-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.todo-icon.alert { background: #fff1f0; color: #f5222d; }
.todo-icon.renew { background: #fff7e6; color: #fa8c16; }
.todo-icon.config { background: #e6f7ff; color: #1890ff; }
.todo-content { flex: 1; }
.todo-title { font-size: 13px; font-weight: 500; }
.todo-desc { font-size: 12px; color: var(--text-secondary); }
.todo-count { font-size: 20px; font-weight: 600; color: var(--text-primary); }

@media (max-width: 1024px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .stat-cards { grid-template-columns: 1fr; } .home-header { flex-direction: column; gap: 12px; } }
</style>