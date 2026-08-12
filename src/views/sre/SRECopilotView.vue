<template>
  <div class="sre-copilot-view">
    <div class="sre-header">
      <div class="sre-header-left">
        <button class="sre-back-btn" @click="goBack" title="返回"><i class="fa-solid fa-arrow-left"></i></button>
        <i class="fa-solid fa-shield-halved sre-logo"></i>
        <div class="sre-header-text">
          <h1 class="sre-title">智能故障自愈终端</h1>
          <div class="sre-subtitle-row">
            <p class="sre-subtitle">实时生产环境全链路自动感知、排查与自愈一体化终端</p>
            <button v-if="incident?.appName" class="sre-app-badge" @click="goBack" title="返回应用详情">
              <i class="fa-solid fa-cube"></i>
              {{ incident.appName }}
              <span v-if="incident.service" class="sre-app-service">{{ incident.service }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="sre-header-right">
        <a-button type="primary" size="large" class="sre-postmortem-btn" @click="activeTab = 'postmortem'" v-if="incident">
          <i class="fa-solid fa-lightbulb"></i>
          一键智能分析
        </a-button>
        <span class="sre-status-badge" :class="'status-' + (incident?.status || 'loading')">
          <i class="fa-solid fa-circle"></i>
          {{ statusText }}
        </span>
      </div>
    </div>

    <div class="sre-tabs-bar">
      <button class="sre-tab" :class="{ active: activeTab === 'analysis' }" @click="activeTab = 'analysis'">
        <i class="fa-solid fa-magnifying-glass-chart"></i>
        故障分析
      </button>
      <button class="sre-tab" :class="{ active: activeTab === 'postmortem' }" @click="activeTab = 'postmortem'">
        <i class="fa-solid fa-file-lines"></i>
        复盘沉淀
        <span v-if="postmortem" class="tab-check"><i class="fa-solid fa-circle-check"></i></span>
      </button>
    </div>

    <div v-if="loading" class="sre-loading">
      <a-spin tip="加载故障数据中..." />
    </div>

    <template v-else-if="incident">
      <!-- 故障分析视图 -->
      <div v-if="activeTab === 'analysis'" class="sre-content">
        <div class="sre-main-left">
          <div class="sre-row sre-row-1">
            <div class="sre-cell sre-cell-left">
              <FaultSummaryCard :incident="incident" />
            </div>
            <div class="sre-cell sre-cell-right">
              <TopologyPanel :data="topology" :selected-node-id="selectedNodeId" :highlight-app-node-id="appNodeId" @node-click="onNodeClick" />
            </div>
          </div>
          <div class="sre-row sre-row-2">
            <div class="sre-cell sre-cell-full">
              <CallTracePanel :traces="callTrace" :app-name="incident?.service" />
            </div>
          </div>
          <div class="sre-row sre-row-3">
            <div class="sre-cell sre-cell-left">
              <ErrorRateTrend :data="errorRateTrend" :app-name="incident?.appName" />
            </div>
            <div class="sre-cell sre-cell-right">
              <LinkedLogsPanel :logs="linkedLogs" />
            </div>
          </div>
        </div>

        <div class="sre-main-right">
          <HealingPlaybook v-if="playbook" :playbook="playbook" :app-name="incident?.appName" :recommendations="recommendations" @execute-step="executeStep" @ai-auto-execute="aiAutoExecute" />
        </div>
      </div>

      <!-- 复盘沉淀视图 -->
      <div v-if="activeTab === 'postmortem'" class="sre-content sre-postmortem-view">
        <PostmortemReport v-if="postmortem" :report="postmortem" @back="activeTab = 'analysis'" />
        <a-empty v-else description="暂无复盘报告" style="margin: 60px 0" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import FaultSummaryCard from '../../components/sre/FaultSummaryCard.vue'
import TopologyPanel from '../../components/sre/TopologyPanel.vue'
import ErrorRateTrend from '../../components/sre/ErrorRateTrend.vue'
import HealingPlaybook from '../../components/sre/HealingPlaybook.vue'
import PostmortemReport from '../../components/sre/PostmortemReport.vue'
import CallTracePanel from '../../components/sre/CallTracePanel.vue'
import LinkedLogsPanel from '../../components/sre/LinkedLogsPanel.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const incident = ref(null)
const topology = ref({ nodes: [], edges: [] })
const playbook = ref(null)
const postmortem = ref(null)
const errorRateTrend = ref([])
const logs = ref([])
const traces = ref([])
const callTrace = ref([])
const linkedLogs = ref([])
const recommendations = ref([])
const activeTab = ref('analysis')
const selectedNodeId = ref('')

const statusText = computed(() => {
  if (!incident.value) return ''
  return { healing: '自愈中', resolved: '已恢复', investigating: '排查中', loading: '加载中...' }[incident.value.status] || incident.value.status
})

const appNodeId = computed(() => incident.value?.appNodeId || '')

async function fetchData() {
  loading.value = true
  try {
    const id = route.params.id
    const res = await fetch(`/api/sre/incidents/${id}`)
    const json = await res.json()
    if (json.success) {
      incident.value = json.data.incident
      topology.value = json.data.topology
      playbook.value = json.data.playbook
      postmortem.value = json.data.postmortem
      errorRateTrend.value = json.data.errorRateTrend
    }
    const logsRes = await fetch(`/api/sre/incidents/${id}/logs`)
    const logsJson = await logsRes.json()
    if (logsJson.success) logs.value = logsJson.data

    const tracesRes = await fetch(`/api/sre/incidents/${id}/traces`)
    const tracesJson = await tracesRes.json()
    if (tracesJson.success) traces.value = tracesJson.data

    const callTraceRes = await fetch(`/api/sre/incidents/${id}/call-trace`)
    const callTraceJson = await callTraceRes.json()
    if (callTraceJson.success) callTrace.value = callTraceJson.data

    const linkedLogsRes = await fetch(`/api/sre/incidents/${id}/linked-logs`)
    const linkedLogsJson = await linkedLogsRes.json()
    if (linkedLogsJson.success) linkedLogs.value = linkedLogsJson.data

    const recRes = await fetch(`/api/sre/playbook-recommendations`)
    const recJson = await recRes.json()
    if (recJson.success) recommendations.value = recJson.data
  } catch (e) {
    console.error('Failed to fetch incident data:', e)
  } finally {
    loading.value = false
  }
}

function onNodeClick(nodeId) {
  selectedNodeId.value = nodeId
  message.info('已选中节点: ' + topology.value.nodes.find(n => n.id === nodeId)?.label || nodeId)
}

async function executeStep(stepIndex) {
  if (!playbook.value) return
  const step = playbook.value.steps[stepIndex]
  step.status = 'running'
  step.progress = 0
  step.logs.push({ time: new Date().toTimeString().slice(0, 8), message: '开始执行...' })

  try {
    const res = await fetch(`/api/sre/incidents/${incident.value.id}/heal/${stepIndex}`, { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      // Poll for progress
      const poll = setInterval(() => {
        step.progress = json.data.progress
        if (json.data.status === 'success') {
          clearInterval(poll)
          playbook.value.validation.completedSteps++
          if (playbook.value.validation.completedSteps >= playbook.value.validation.totalSteps) {
            playbook.value.validation.http200Status = '已恢复'
          }
          message.success(step.name + ' 执行完成')
        }
      }, 500)
    }
  } catch (e) {
    step.status = 'failed'
    message.error('执行失败')
  }
}

function goBack() {
  router.back()
  setTimeout(() => {
    const win = window
    if (win.__openDrawerFromIncident) win.__openDrawerFromIncident()
  }, 300)
}

function aiAutoExecute() {
  if (!playbook.value) return
  playbook.value.steps.forEach((step, i) => {
    if (step.status === 'pending') {
      setTimeout(() => executeStep(i), i * 1500)
    }
  })
  message.info('AI 自动执行已启动，按顺序执行所有待执行步骤')
}

onMounted(fetchData)
watch(() => route.params.id, fetchData)
</script>

<style scoped>
.sre-copilot-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
}

.sre-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  color: #1a1a1a;
  flex-shrink: 0;
}
.sre-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sre-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}
.sre-back-btn:hover { color: #722ED1; border-color: #722ED1; }
.sre-logo {
  font-size: 22px;
  color: #722ED1;
}
.sre-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}
.sre-subtitle {
  font-size: 11px;
  color: #8c8c8c;
  margin: 1px 0 0;
  line-height: 1.4;
}
.sre-subtitle-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sre-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.sre-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}
.sre-app-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid #1890ff;
  border-radius: 4px;
  background: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
  flex-shrink: 0;
}
.sre-app-badge:hover { background: #bae7ff; }
.sre-app-badge i { font-size: 10px; }
.sre-app-service { font-size: 10px; font-weight: 400; color: #69c0ff; margin-left: 2px; }
.status-healing { background: #f9f0ff; color: #722ED1; }
.status-resolved { background: #f6ffed; color: #52c41a; }
.status-investigating { background: #fff7e6; color: #FF7D00; }

.sre-tabs-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
  flex-shrink: 0;
}
.sre-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.sre-tab:hover { color: #1a1a1a; }
.sre-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}
.sre-tab i:first-child { margin-right: 2px; }
.tab-check { color: #52c41a; margin-left: 4px; }

.sre-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 180px);
}

.sre-content {
  display: flex;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}
.sre-main-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  gap: 16px;
  min-height: 0;
}
.sre-row {
  display: flex;
  gap: 16px;
  min-height: 0;
  flex-shrink: 0;
}
.sre-row-3 { height: 410px; }
.sre-cell { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.sre-cell-full { flex: 1; max-height: 210px; overflow-y: auto; }
.sre-cell-left { flex: 1; }
.sre-cell-right { flex: 1; overflow-y: auto; }
.sre-cell-left .fault-summary-card,
.sre-cell-left .error-rate-trend,
.sre-cell-right .topology-panel,
.sre-cell-right .linked-logs-panel { flex: 1; }
.sre-main-right {
  flex: 0 0 380px;
  border-left: 1px solid #f0f0f0;
  background: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.sre-postmortem-view {
  padding: 0;
}
.sre-postmortem-view .postmortem-report {
  border: none;
  border-radius: 0;
}

.sre-postmortem-btn {
  background: linear-gradient(135deg, #722ED1, #9254de);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  flex-shrink: 0;
}
.sre-postmortem-btn:hover {
  background: linear-gradient(135deg, #9254de, #b37feb);
}
.sre-postmortem-btn i { margin-right: 4px; font-size: 11px; }

/* ===== Mobile ===== */
@media (max-width: 768px) {
  .sre-header {
    padding: 6px 12px;
    flex-wrap: wrap;
    gap: 4px;
  }
  .sre-header-left { gap: 6px; }
  .sre-logo { font-size: 18px; }
  .sre-title { font-size: 14px; }
  .sre-subtitle { font-size: 10px; }
  .sre-status-badge { font-size: 11px; padding: 2px 8px; }
  .sre-back-btn { width: 28px; height: 28px; }

  .sre-tabs-bar { padding: 0 8px; overflow-x: auto; }
  .sre-tab { padding: 6px 10px; font-size: 12px; gap: 4px; }
  .sre-tab span:not(.tab-check) { display: none; }

  .sre-content {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .sre-main-left {
    padding: 8px;
    gap: 8px;
    overflow: visible;
  }
  .sre-row { flex-direction: column; gap: 8px; }
  .sre-row-1, .sre-row-2, .sre-row-3 { flex: none; }
  .sre-cell-left, .sre-cell-right, .sre-cell-full { flex: none; }

  .sre-main-right {
    flex: none;
    width: 100%;
    border-left: none;
    border-top: 1px solid #f0f0f0;
    max-height: 50vh;
    overflow-y: auto;
  }

  .sre-loading { height: 50vh; }

  .sre-postmortem-btn { height: 28px; font-size: 12px; }

  .sre-postmortem-view { padding: 0; }
  .sre-postmortem-view .pmr-header { padding: 12px 12px 10px; }
  .sre-postmortem-view .pmr-title { font-size: 11px; }
  .sre-postmortem-view .pmr-subtitle { font-size: 15px; margin: 4px 0 8px; }
  .sre-postmortem-view .pmr-body { padding: 12px; }
  .sre-postmortem-view .pmr-content { font-size: 13px; }
}
</style>
