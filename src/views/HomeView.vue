<template>
  <div class="home-view">
    <div class="home-header">
      <h1>工作台</h1>
      <p class="subtitle">欢迎回来，这里是今天的概览</p>
    </div>

    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon warning"><i class="fa-solid fa-bell"></i></div>
        <div class="card-content">
          <div class="card-value">{{ stats.activeAlerts }}</div>
          <div class="card-label">活跃告警</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon danger"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="card-content">
          <div class="card-value">{{ stats.critical }}</div>
          <div class="card-label">紧急</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon info"><i class="fa-solid fa-server"></i></div>
        <div class="card-content">
          <div class="card-value">{{ stats.resources }}</div>
          <div class="card-label">在线资源</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon success"><i class="fa-solid fa-check-circle"></i></div>
        <div class="card-content">
          <div class="card-value">{{ stats.tasksDone }}</div>
          <div class="card-label">任务完成</div>
        </div>
      </div>
    </div>

    <div class="home-grid">
      <div class="quick-access">
        <h3>快捷入口</h3>
        <div class="quick-items">
          <div class="quick-item" @click="$router.push('/monitor')">
            <i class="fa-solid fa-chart-line"></i>
            <span>监控中心</span>
          </div>
          <div class="quick-item" @click="$router.push('/alarm')">
            <i class="fa-solid fa-bell"></i>
            <span>告警中心</span>
          </div>
          <div class="quick-item" @click="$router.push('/resource')">
            <i class="fa-solid fa-database"></i>
            <span>资源中心</span>
          </div>
          <div class="quick-item" @click="$router.push('/ops')">
            <i class="fa-solid fa-terminal"></i>
            <span>运维中心</span>
          </div>
        </div>
      </div>

      <div class="todo-list">
        <h3>个人待办 <span class="badge">{{ todos.length }}</span></h3>
        <div class="todo-items">
          <div class="todo-item" v-for="todo in todos" :key="todo.id">
            <a-checkbox :checked="todo.done" @change="toggleTodo(todo.id)">
              <span :class="{ done: todo.done }">{{ todo.title }}</span>
            </a-checkbox>
            <span class="todo-time">{{ todo.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h3>统计看板</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span>告警趋势</span>
            <span class="stat-period">近7天</span>
          </div>
          <div class="stat-chart">
            <div class="simple-chart">
              <div class="bar" v-for="(v, i) in alertTrend" :key="i" :style="{ height: v + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span>资源使用率</span>
            <span class="stat-period">当前</span>
          </div>
          <div class="stat-chart">
            <div class="usage-list">
              <div class="usage-item" v-for="u in usageStats" :key="u.name">
                <span class="usage-name">{{ u.name }}</span>
                <a-progress :percent="u.value" :showInfo="false" :strokeColor="u.color" />
                <span class="usage-value">{{ u.value }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span>任务统计</span>
            <span class="stat-period">本月</span>
          </div>
          <div class="stat-chart task-stats">
            <div class="task-item">
              <span class="task-label">执行中</span>
              <span class="task-value running">{{ taskStats.running }}</span>
            </div>
            <div class="task-item">
              <span class="task-label">已完成</span>
              <span class="task-value done">{{ taskStats.done }}</span>
            </div>
            <div class="task-item">
              <span class="task-label">失败</span>
              <span class="task-value failed">{{ taskStats.failed }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const stats = reactive({
  activeAlerts: 12,
  critical: 3,
  resources: 156,
  tasksDone: 28
})

const todos = ref([
  { id: 1, title: '处理告警 #2345 CPU告警', done: false, time: '10:30' },
  { id: 2, title: '审核巡检报告', done: false, time: '11:00' },
  { id: 3, title: '更新监控阈值', done: true, time: '09:15' },
  { id: 4, title: '处理告警 #2342 磁盘告警', done: false, time: '14:00' }
])

const alertTrend = ref([60, 45, 80, 55, 70, 90, 65])

const usageStats = ref([
  { name: 'CPU', value: 72, color: '#faad14' },
  { name: '内存', value: 68, color: '#1890ff' },
  { name: '磁盘', value: 45, color: '#52c41a' },
  { name: '网络', value: 35, color: '#722ed1' }
])

const taskStats = reactive({
  running: 5,
  done: 42,
  failed: 2
})

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.done = !todo.done
}
</script>

<style scoped>
.home-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.home-header {
  margin-bottom: 24px;
}

.home-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.card-icon.warning { background: #fff7e6; color: #fa8c16; }
.card-icon.danger { background: #fff1f0; color: #f5222d; }
.card-icon.info { background: #e6f7ff; color: #1890ff; }
.card-icon.success { background: #f6ffed; color: #52c41a; }

.card-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .home-grid { grid-template-columns: 1fr; }
}

.quick-access, .todo-list {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.quick-access h3, .todo-list h3, .stats-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-item:hover {
  background: var(--brand-subtle);
  transform: translateY(-2px);
}

.quick-item i {
  font-size: 24px;
  color: var(--brand);
}

.quick-item span {
  font-size: 14px;
  color: var(--text-primary);
}

.badge {
  background: var(--brand);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.todo-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.todo-item:last-child { border-bottom: none; }

.todo-item .done {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.todo-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.stats-section h3 {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-header span:first-child {
  font-weight: 600;
}

.stat-period {
  font-size: 12px;
  color: var(--text-secondary);
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100px;
  gap: 8px;
}

.bar {
  flex: 1;
  background: var(--brand);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usage-name {
  width: 40px;
  font-size: 12px;
}

.usage-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
}

.task-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.task-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.task-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.task-value {
  font-size: 24px;
  font-weight: 600;
}

.task-value.running { color: #1890ff; }
.task-value.done { color: #52c41a; }
.task-value.failed { color: #f5222d; }
</style>