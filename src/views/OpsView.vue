<template>
  <div class="ops-view">
    <div class="view-header">
      <h1>运维中心</h1>
    </div>

    <div class="ops-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'jobs' }" @click="activeTab = 'jobs'">
        <i class="fa-solid fa-robot"></i> 自动作业
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">
        <i class="fa-solid fa-file-lines"></i> 日志管理
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'inspect' }" @click="activeTab = 'inspect'">
        <i class="fa-solid fa-clipboard-check"></i> 巡检报告
      </button>
    </div>

    <!-- 自动作业 -->
    <div class="tab-content" v-if="activeTab === 'jobs'">
      <div class="section-header">
        <a-button type="primary" @click="showJobModal">
          <i class="fa-solid fa-plus"></i> 新建任务
        </a-button>
      </div>

      <a-tabs v-model:activeKey="jobsSubTab" type="card">
        <a-tab-pane key="running" tab="执行中">
          <div class="job-list">
            <div class="job-item running" v-for="job in runningJobs" :key="job.id">
              <div class="job-icon"><i class="fa-solid fa-spinner fa-spin"></i></div>
              <div class="job-content">
                <div class="job-name">{{ job.name }}</div>
                <div class="job-progress">
                  <a-progress :percent="job.progress" size="small" :showInfo="false" />
                  <span class="progress-text">{{ job.progress }}%</span>
                </div>
                <div class="job-meta">目标: {{ job.target }} | 开始: {{ job.startTime }}</div>
              </div>
              <div class="job-actions">
                <a-button size="small" danger @click="stopJob(job.id)">停止</a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="history" tab="执行历史">
          <a-table :columns="jobColumns" :data-source="jobHistory" :pagination="{ pageSize: 8 }" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getJobStatusColor(record.status)">{{ getJobStatusText(record.status) }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewJobLog(record)">查看日志</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="scripts" tab="脚本管理">
          <div class="script-list">
            <div class="script-item" v-for="script in scripts" :key="script.id">
              <div class="script-icon"><i class="fa-solid fa-code"></i></div>
              <div class="script-info">
                <div class="script-name">{{ script.name }}</div>
                <div class="script-desc">{{ script.description }}</div>
                <div class="script-meta">类型: {{ script.type }} | 更新时间: {{ script.updateTime }}</div>
              </div>
              <div class="script-actions">
                <a-button size="small" @click="runScript(script)">执行</a-button>
                <a-button size="small" @click="editScript(script)">编辑</a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 日志管理 -->
    <div class="tab-content" v-if="activeTab === 'logs'">
      <div class="log-filters">
        <a-select v-model:value="logLevel" placeholder="日志级别" style="width: 120px" allowClear>
          <a-select-option value="error">Error</a-select-option>
          <a-select-option value="warn">Warn</a-select-option>
          <a-select-option value="info">Info</a-select-option>
          <a-select-option value="debug">Debug</a-select-option>
        </a-select>
        <a-select v-model:value="logSource" placeholder="来源" style="width: 140px" allowClear>
          <a-select-option value="api">API服务</a-select-option>
          <a-select-option value="worker">后台任务</a-select-option>
          <a-select-option value="scheduler">调度器</a-select-option>
        </a-select>
        <a-range-picker v-model:value="logRange" style="width: 240px" />
      </div>
      <div class="log-search">
        <a-input-search v-model:value="logSearch" placeholder="搜索日志内容" style="width: 400px" @search="searchLogs" />
      </div>
      <div class="log-list">
        <div class="log-item" v-for="log in filteredLogs" :key="log.id" :class="log.level">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-source">[{{ log.source }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 巡检报告 -->
    <div class="tab-content" v-if="activeTab === 'inspect'">
      <div class="inspect-header">
        <div class="inspect-stats">
          <div class="stat-item"><span class="stat-value">{{ inspectStats.total }}</span><span class="stat-label">巡检计划</span></div>
          <div class="stat-item"><span class="stat-value">{{ inspectStats.running }}</span><span class="stat-label">执行中</span></div>
          <div class="stat-item"><span class="stat-value">{{ inspectStats.done }}</span><span class="stat-label">已完成</span></div>
          <div class="stat-item"><span class="stat-value">{{ inspectStats.issues }}</span><span class="stat-label">发现问题</span></div>
        </div>
        <a-button type="primary" @click="createInspectPlan"><i class="fa-solid fa-plus"></i> 新建巡检计划</a-button>
      </div>
      <div class="inspect-plans">
        <div class="plan-card" v-for="plan in inspectPlans" :key="plan.id">
          <div class="plan-header">
            <h4>{{ plan.name }}</h4>
            <a-tag :color="getPlanStatusColor(plan.status)">{{ getPlanStatusText(plan.status) }}</a-tag>
          </div>
          <div class="plan-info">
            <p>{{ plan.description }}</p>
            <div class="plan-meta"><span><i class="fa-regular fa-clock"></i> {{ plan.schedule }}</span><span><i class="fa-solid fa-server"></i> {{ plan.targetCount }} 个目标</span></div>
          </div>
          <div class="plan-actions">
            <a-button size="small" @click="runInspect(plan.id)">立即执行</a-button>
            <a-button size="small" @click="viewInspectReport(plan)">查看报告</a-button>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="logModalVisible" title="任务日志" width="800px">
      <pre class="log-modal-content">{{ logContent }}</pre>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const activeTab = ref('jobs')
const jobsSubTab = ref('running')
const logLevel = ref(null)
const logSource = ref(null)
const logRange = ref(null)
const logSearch = ref('')
const logModalVisible = ref(false)
const logContent = ref('')

const runningJobs = ref([
  { id: 1, name: '数据库巡检', target: 'db-primary, db-replica-02', progress: 65, startTime: '2026-06-17 10:30:00' },
  { id: 2, name: '安全扫描', target: '华北区域一', progress: 30, startTime: '2026-06-17 10:00:00' },
])
const jobHistory = ref([
  { id: 1, name: '全量备份', target: 'db-primary', startTime: '2026-06-17 02:00:00', endTime: '2026-06-17 02:45:00', duration: '45分钟', status: 'success' },
  { id: 2, name: '日志清理', target: 'log-collector', startTime: '2026-06-17 03:00:00', endTime: '2026-06-17 03:12:00', duration: '12分钟', status: 'success' },
])
const scripts = ref([
  { id: 1, name: '健康检查脚本', description: '系统健康状态巡检', type: 'Shell', updateTime: '2026-06-01' },
  { id: 2, name: '日志清理脚本', description: '过期日志自动清理', type: 'Python', updateTime: '2026-05-15' },
])
const logs = ref([
  { id: 1, level: 'INFO', source: 'server-001', time: '2026-06-17 10:30:00', message: '巡检任务完成' },
  { id: 2, level: 'WARN', source: 'db-primary', time: '2026-06-17 10:28:00', message: '磁盘使用率 92%' },
  { id: 3, level: 'ERROR', source: 'api-gateway', time: '2026-06-17 10:25:00', message: '响应超时 2500ms' },
])
const inspectStats = ref({ total: 5, running: 1, done: 12, issues: 3 })
const inspectPlans = ref([
  { id: 1, name: '每日巡检', description: '数据库每日健康巡检', schedule: '每天 09:00', targetCount: 5, status: 'active' },
  { id: 2, name: '安全合规巡检', description: '安全基线检查', schedule: '每周一 10:00', targetCount: 20, status: 'active' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [jobsRes, histRes, logsRes, plansRes] = await Promise.all([
      fetch('/api/cmdb/jobs?status=running&sort=id&order=ASC'),
      fetch('/api/cmdb/job_history?sort=id&order=DESC&pageSize=2'),
      fetch('/api/cmdb/operation_logs?sort=id&order=DESC&pageSize=3'),
      fetch('/api/cmdb/inspection_plans?sort=id&order=ASC'),
    ])
    const jobsJson = await jobsRes.json()
    const histJson = await histRes.json()
    const logsJson = await logsRes.json()
    const plansJson = await plansRes.json()
    if (jobsJson.success) {
      runningJobs.value = jobsJson.data.map(function(i) { return { id: i.id, name: i.name, target: i.target, progress: i.progress, startTime: i.start_time } })
    }
    if (histJson.success) {
      jobHistory.value = histJson.data.map(function(i) { return { id: i.id, name: i.name, target: i.target, startTime: i.start_time, endTime: i.end_time, duration: i.duration, status: i.status } })
    }
    if (logsJson.success) {
      logs.value = logsJson.data.map(function(i) { return { id: i.id, level: i.level, source: i.hostname, time: i.time, message: i.detail } })
    }
    if (plansJson.success) {
      inspectPlans.value = plansJson.data.map(function(i) { return { id: i.id, name: i.name, description: i.description, schedule: i.schedule, targetCount: i.target_count, status: i.status } })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const jobColumns = [
  { title: '任务名称', dataIndex: 'name' }, { title: '目标', dataIndex: 'target' },
  { title: '开始', dataIndex: 'startTime' }, { title: '结束', dataIndex: 'endTime' },
  { title: '状态', key: 'status' }, { title: '操作', key: 'action' },
]

const filteredLogs = computed(() => logs.value)
const getJobStatusColor = s => ({ success: 'green', failed: 'red' }[s])
const getJobStatusText = s => ({ success: '成功', failed: '失败' }[s])
const getPlanStatusColor = s => ({ scheduled: 'blue', running: 'orange' }[s])
const getPlanStatusText = s => ({ scheduled: '已计划', running: '执行中' }[s])

const showJobModal = () => {}
const stopJob = id => { runningJobs.value = runningJobs.value.filter(j => j.id !== id) }
const viewJobLog = record => { logContent.value = `任务: ${record.name}\n目标: ${record.target}\n状态: ${record.status}`; logModalVisible.value = true }
const runScript = script => { runningJobs.value.push({ id: Date.now(), name: script.name, target: '手动执行', progress: 0, startTime: new Date().toLocaleTimeString() }) }
const editScript = () => {}
const searchLogs = () => {}
const createInspectPlan = () => {}
const runInspect = id => {}
const viewInspectReport = plan => {}
</script>

<style scoped>
.ops-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.view-header { margin-bottom: 20px; }
.view-header h1 { font-size: 24px; font-weight: 600; margin: 0; }

.ops-tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
.tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: none; background: transparent; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
.tab-btn:hover { background: var(--bg-sec); color: var(--text); }
.tab-btn.active { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
.section-header { margin-bottom: 16px; }

.job-list, .script-list { display: flex; flex-direction: column; gap: 12px; }
.job-item, .script-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.job-icon { font-size: 24px; color: var(--brand); }
.job-content { flex: 1; }
.job-name { font-weight: 500; margin-bottom: 8px; }
.job-progress { display: flex; align-items: center; gap: 12px; }
.progress-text { font-size: 12px; color: var(--text-secondary); }
.job-meta { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.script-icon { width: 40px; height: 40px; background: var(--bg-sec); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.script-info { flex: 1; }
.script-name { font-weight: 500; }
.script-desc { font-size: 12px; color: var(--text-secondary); }
.script-meta { font-size: 11px; color: var(--text-ter); }
.script-actions { display: flex; gap: 8px; }

.log-filters { display: flex; gap: 12px; margin-bottom: 16px; }
.log-search { margin-bottom: 16px; }
.log-list { background: var(--bg-card); border-radius: 8px; font-family: monospace; font-size: 12px; }
.log-item { padding: 8px 16px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; }
.log-item:last-child { border-bottom: none; }
.log-item.error { background: #fff1f0; }
.log-item.warn { background: #fff7e6; }
.log-time { color: var(--text-ter); }
.log-level { font-weight: 600; width: 50px; }
.log-item.error .log-level { color: #f5222d; }
.log-item.warn .log-level { color: #fa8c16; }
.log-source { color: #722ed1; }
.log-message { flex: 1; }

.inspect-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.inspect-stats { display: flex; gap: 24px; }
.stat-item { text-align: center; }
.stat-value { display: block; font-size: 28px; font-weight: 600; }
.stat-label { font-size: 12px; color: var(--text-secondary); }

.inspect-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
.plan-card { background: var(--bg-card); border-radius: 8px; padding: 20px; }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.plan-header h4 { margin: 0; }
.plan-info p { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.plan-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-ter); }
.plan-actions { display: flex; gap: 8px; margin-top: 16px; }
.log-modal-content { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow: auto; max-height: 400px; }
</style>