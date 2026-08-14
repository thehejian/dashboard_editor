<template>
  <div>
    <div class="breadcrumb"><span>异常事件管理</span> / <span>日志追踪</span> / <span>追踪结果</span></div>
    <div class="page-header">
      <h3>追踪结果 - {{ task?.id || '' }}</h3>
      <a-button @click="goBack">← 返回</a-button>
    </div>
    <div v-if="task" class="task-info-card">
      <h4>任务信息</h4>
      <div class="info-grid">
        <div><label>任务类型</label><span><a-tag :color="task.traceType === 'event' ? '#1890ff' : '#52c41a'">{{ task.traceType === 'event' ? '事件追踪' : '实时追踪' }}</a-tag></span></div>
        <div><label>任务状态</label><a-tag :color="TASK_STATUS_COLORS[task.status]">{{ TASK_STATUS[task.status] }}</a-tag></div>
        <div><label>资源名称</label><span>{{ task.ciName }}</span></div>
        <div><label>资源类型</label><span>{{ CI_TYPE_MAP[task.ciType] || task.ciType }}</span></div>
        <div><label>日志文件路径</label><span class="path-text">{{ task.logFilePath }}</span></div>
        <div><label>来源主机</label><span>{{ task.sourceHost }} / {{ task.sourceIp }}</span></div>
        <div><label>结果行数</label><span>{{ task.resultCount }} 行</span></div>
        <div><label>创建时间</label><span>{{ task.createAt }}</span></div>
        <template v-if="task.traceType === 'event'">
          <div><label>关联事件 ID</label><span>{{ task.eventId }}</span></div>
          <div><label>事件时间</label><span>{{ task.eventTime }}</span></div>
          <div><label>前后行设置</label><span>前 {{ task.beforeLines }} 行 / 后 {{ task.afterLines }} 行</span></div>
        </template>
        <template v-if="task.traceType === 'realtime'">
          <div><label>追踪开始时间</label><span>{{ task.startTime || '-' }}</span></div>
          <div><label>追踪结束时间</label><span>{{ task.endTime || '进行中' }}</span></div>
        </template>
      </div>
      <div v-if="task.status === 'no_log'" class="error-msg">失败原因：{{ task.errorMsg }}</div>
    </div>
    <div class="log-content-area">
      <div class="log-header"><span class="log-title">追踪日志内容</span><span class="log-count">共 {{ (logs || []).length }} 行</span></div>
      <div v-if="task?.status === 'no_log'" class="empty-state error">日志不存在：{{ task.errorMsg }}</div>
      <div v-else-if="task?.status === 'running'" class="empty-state running">任务执行中，请稍候...</div>
      <div v-else-if="!logs || !logs.length" class="empty-state no-data">暂无日志数据</div>
      <div v-else class="log-list">
        <div v-for="log in logs" :key="log.lineNum" class="log-line" :class="{ 'event-line': log.isEvent }">
          <span class="line-num">{{ String(log.lineNum).padStart(4, ' ') }}</span>
          <span class="line-content">{{ log.content }}</span>
          <span v-if="log.isEvent" class="event-badge">事件行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MOCK_TRACE_TASKS, MOCK_TRACE_LOGS, TASK_STATUS, TASK_STATUS_COLORS } from './mockData.js'

const route = useRoute()
const router = useRouter()
const CI_TYPE_MAP = { SYS_DeployComponent: '微服务', CLOUD_VM: '虚拟机', CLOUD_GAUSSDB_INSTANCE: 'GaussDB 实例', CLOUD_PM: '物理机' }

const taskId = computed(() => route.query.taskId || '')
const task = computed(() => MOCK_TRACE_TASKS.find(t => t.id === taskId.value))
const logs = computed(() => MOCK_TRACE_LOGS[taskId.value] || [])

function goBack() { router.push('/ops/events/trace/tasks') }
</script>

<style scoped>
.breadcrumb { font-size: 12px; color: #999; margin-bottom: 16px; }
.breadcrumb span { color: #999; }
.breadcrumb span:last-child { color: #333; font-weight: 500; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.task-info-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
.task-info-card h4 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 12px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-grid div { display: flex; gap: 8px; font-size: 12px; align-items: center; }
.info-grid label { color: #999; flex-shrink: 0; min-width: 80px; }
.info-grid span { color: #333; }
.path-text { font-family: monospace; font-size: 11px; }
.error-msg { margin-top: 12px; padding: 8px 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 4px; color: #ff4d4f; font-size: 12px; }
.log-content-area { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
.log-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.log-title { font-size: 13px; font-weight: 600; color: #333; }
.log-count { font-size: 12px; color: #999; }
.log-list { background: #1e1e1e; padding: 8px 0; font-family: monospace; font-size: 12px; line-height: 1.8; }
.log-line { display: flex; align-items: center; padding: 0 16px; }
.log-line:hover { background: rgba(255,255,255,0.05); }
.log-line.event-line { background: rgba(255,77,79,0.1); border-left: 3px solid #ff4d4f; }
.line-num { color: #858585; min-width: 40px; text-align: right; margin-right: 16px; user-select: none; }
.line-content { color: #d4d4d4; white-space: pre; }
.event-badge { margin-left: 12px; padding: 0 6px; height: 16px; line-height: 16px; border-radius: 3px; background: #ff4d4f; color: #fff; font-size: 10px; font-family: sans-serif; flex-shrink: 0; }
.empty-state { padding: 24px; text-align: center; font-size: 13px; }
.empty-state.error { color: #ff4d4f; }
.empty-state.running { color: #faad14; }
.empty-state.no-data { color: #999; }
</style>