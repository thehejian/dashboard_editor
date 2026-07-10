<template>
  <div class="ai-assistant">
    <button class="ai-fab" @click="open = !open" :title="open ? '关闭AI助手' : '打开AI助手'">
      <i class="fa-solid fa-robot"></i>
    </button>
    <div class="ai-panel" :class="{ open }">
      <div class="ai-mask" @click="open = false"></div>
      <div class="ai-panel-content">
        <div class="ai-header">
          <h3><i class="fa-solid fa-robot"></i> AI 助手</h3>
          <button class="close-btn" @click="open = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="ai-body" ref="bodyRef">
          <div v-if="messages.length === 0" class="ai-welcome">
            <div class="welcome-icon"><i class="fa-solid fa-robot"></i></div>
            <p class="welcome-title">你好，我是运维 AI 助手</p>
            <p class="welcome-desc">我可以帮你分析监控数据、排查故障、生成查询语句</p>
            <div class="quick-actions">
              <button class="quick-btn" @click="analyzePage"><i class="fa-solid fa-chart-line"></i> 分析当前页面</button>
              <button class="quick-btn" @click="askPromQL"><i class="fa-solid fa-database"></i> 写 PromQL 查询</button>
              <button class="quick-btn" @click="summarizeAlerts"><i class="fa-solid fa-bell"></i> 总结今日告警</button>
              <button class="quick-btn" @click="detectFaults"><i class="fa-solid fa-stethoscope"></i> 检测系统故障</button>
            </div>
          </div>
          <div v-for="(msg, i) in messages" :key="i" class="ai-msg" :class="msg.role">
            <div class="msg-avatar">{{ msg.role === 'user' ? 'U' : 'AI' }}</div>
            <div class="msg-content">
              <div class="msg-bubble"><div class="md-content" v-html="renderMarkdown(msg.content)"></div></div>
              <div v-if="msg.actions?.length" class="msg-actions">
                <button v-for="(act, j) in msg.actions" :key="j" class="action-btn" @click="runAction(act)"><i class="fa-solid fa-bolt"></i> {{ act.label }}</button>
              </div>
            </div>
          </div>
          <div v-if="loading" class="ai-msg assistant">
            <div class="msg-avatar">AI</div>
            <div class="msg-content"><div class="msg-bubble thinking"><i class="fa-solid fa-ellipsis"></i></div></div>
          </div>
        </div>
        <div class="ai-footer">
          <div class="input-row">
            <input v-model="inputText" class="ai-input" placeholder="输入你的问题..." @keydown.enter="sendMessage" :disabled="loading" />
            <button class="send-btn" @click="sendMessage" :disabled="loading || !inputText.trim()">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点详情面板 -->
    <div class="node-detail-overlay" :class="{ open: nodeDetailOpen }" @click.self="nodeDetailOpen = false">
      <div class="node-detail-panel">
        <div class="nd-header">
          <div>
            <h3>{{ nodeDetailData?.label || '' }}</h3>
            <span class="nd-id">{{ nodeDetailData?.id || '' }}</span>
          </div>
          <button class="close-btn" @click="nodeDetailOpen = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="nd-body" v-if="nodeDetailData">
          <div class="nd-status-bar">
            <span class="status-tag" :class="'status-' + nodeDetailData.status">{{ statusLabel(nodeDetailData.status) }}</span>
            <span class="nd-type">{{ nodeDetailData.layer }} / {{ nodeDetailData.type }}</span>
          </div>

          <div class="nd-section">
            <div class="nd-section-title"><i class="fa-solid fa-chart-simple"></i> 实时指标</div>
            <div class="nd-metrics-grid">
              <div v-for="(val, key) in nodeDetailData.metrics" :key="key" class="nd-metric-card">
                <div class="metric-val">{{ val }}</div>
                <div class="metric-label">{{ metricLabel(key) }}</div>
              </div>
            </div>
          </div>

          <div class="nd-section" v-if="nodeDetailData.alerts?.length">
            <div class="nd-section-title"><i class="fa-solid fa-bell"></i> 关联告警 ({{ nodeDetailData.alerts.length }})</div>
            <div v-for="a in nodeDetailData.alerts" :key="a.id" class="nd-alert-item">
              <span class="alert-time">{{ a.time }}</span>
              <span class="alert-metric">{{ a.metric }}</span>
              <span class="alert-value">{{ a.value }}</span>
              <span class="status-tag-sm" :class="'status-' + a.level">{{ a.level }}</span>
            </div>
          </div>

          <div class="nd-section">
            <div class="nd-section-title"><i class="fa-solid fa-link"></i> 依赖关系</div>
            <div class="nd-deps">
              <div v-if="nodeDetailData.dependencies?.upstream?.length">
                <span class="dep-label">上游</span>
                <span v-for="d in nodeDetailData.dependencies.upstream" :key="d" class="dep-node">{{ d }} →</span>
              </div>
              <div class="dep-center">{{ nodeDetailData.id }}</div>
              <div v-if="nodeDetailData.dependencies?.downstream?.length">
                <span class="dep-label">下游</span>
                <span v-for="d in nodeDetailData.dependencies.downstream" :key="d" class="dep-node">→ {{ d }}</span>
              </div>
            </div>
          </div>

          <div class="nd-section">
            <div class="nd-section-title"><i class="fa-solid fa-wrench"></i> 修复操作</div>
            <div class="nd-fix-actions">
              <button v-for="fa in getFixActions(nodeDetailData)" :key="fa.action" class="fix-action-btn" @click="openFixConfirm(fa.action, nodeDetailData.id)">
                <i :class="fa.icon"></i> {{ fa.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修复确认弹窗 -->
    <div class="fix-confirm-overlay" v-if="fixConfirmOpen" @click.self="fixConfirmOpen = false">
      <div class="fix-confirm-dialog">
        <div class="fix-confirm-header">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>确认执行修复</span>
        </div>
        <div class="fix-confirm-body" v-if="!fixLoading && !verifyResult">
          <p>确认对 <strong>{{ fixNodeId }}</strong> 执行 <strong>{{ fixActionLabel }}</strong> 操作？</p>
          <p class="fix-warning">此操作将模拟重启/调整服务，生产环境请谨慎操作。</p>
        </div>
        <div class="fix-confirm-body fix-progress" v-else-if="fixLoading && !verifyResult">
          <div class="fix-spinner"></div>
          <p>{{ fixProgressText }}</p>
        </div>
        <div class="fix-confirm-body fix-verify" v-else-if="verifyResult">
          <div class="verify-icon" :class="verifyResult.status === 'normal' ? 'success' : 'warning'">
            <i :class="verifyResult.status === 'normal' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
          </div>
          <p class="verify-title">{{ verifyResult.status === 'normal' ? '修复验证通过' : '验证完成，状态未完全恢复' }}</p>
          <div class="verify-table" v-if="verifyResult.before">
            <div class="verify-row verify-header">
              <span>指标</span><span>修复前</span><span>修复后</span>
            </div>
            <div v-for="(val, key) in verifyResult.metrics" :key="key" class="verify-row">
              <span>{{ metricLabel(key) }}</span>
              <span class="val-before">{{ verifyResult.before[key] || '-' }}</span>
              <span class="val-after">{{ val }}</span>
            </div>
          </div>
        </div>
        <div class="fix-confirm-footer">
          <button class="btn-cancel" @click="fixConfirmOpen = false">{{ verifyResult ? '关闭' : '取消' }}</button>
          <button v-if="!fixLoading && !verifyResult" class="btn-confirm" @click="executeFix">确认执行</button>
          <button v-if="verifyResult" class="btn-confirm" @click="nodeDetailOpen = false; fixConfirmOpen = false">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { setTopoHighlight, clearTopoHighlight, refreshTopology } from '../composables/useEditorState.js'

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text, { breaks: true, gfm: true })
}

const route = useRoute()
const router = useRouter()
const open = ref(false)
const loading = ref(false)
const inputText = ref('')
const messages = ref([])
const bodyRef = ref(null)

const nodeDetailOpen = ref(false)
const nodeDetailData = ref(null)
const fixConfirmOpen = ref(false)
const fixAction = ref('')
const fixNodeId = ref('')
const fixLoading = ref(false)
const fixProgressText = ref('')
const verifyResult = ref(null)

function statusLabel(s) {
  return { critical: '严重', warning: '警告', normal: '正常' }[s] || s
}
function metricLabel(k) {
  return { cpu: 'CPU', memory: '内存', latency: '响应时间', hitRate: '命中率', bandwidth: '带宽', blocked: '拦截量', rules: '规则数', qps: 'QPS', connections: '连接数', errorRate: '错误率' }[k] || k
}
function getFixActions(node) {
  if (node.type === 'service') return [
    { action: 'restart', label: '重启服务', icon: 'fa-solid fa-rotate-right' },
    { action: 'scale', label: '扩容实例', icon: 'fa-solid fa-expand' },
  ]
  if (node.type === 'cache') return [
    { action: 'flush-cache', label: '清除缓存', icon: 'fa-solid fa-broom' },
  ]
  if (node.type === 'gateway') return [
    { action: 'ratelimit', label: '限流降级', icon: 'fa-solid fa-gauge-high' },
    { action: 'restart', label: '重启网关', icon: 'fa-solid fa-rotate-right' },
  ]
  return [{ action: 'restart', label: '重启服务', icon: 'fa-solid fa-rotate-right' }]
}
const fixActionLabel = ref('')

function scrollToBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

const topoNodes = [
  'cdn', 'waf', 'slb', 'lb-api', 'nacos',
  'prod-order-01', 'prod-order-02', 'prod-order-03',
  'prod-user-01', 'prod-user-02',
  'prod-pay-01', 'prod-pay-02',
  'prod-inventory-01', 'prod-product-01',
  'redis-cache', 'mq-order', 'es-cluster',
  'mysql-master', 'mysql-slave', 'mongodb',
  'k8s-master', 'k8s-node-1', 'k8s-node-2', 'k8s-node-3',
]

if (typeof window !== 'undefined') {
  window.__openAIAssistant = async (text) => {
    open.value = true
    await nextTick()
    inputText.value = text
    await sendMessage()
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()
  loading.value = true
  try {
    let overview = {}, alertStats = {}
    try {
      const [o, a] = await Promise.all([
        fetch('/api/cmdb/dashboard/overview').then(r => r.json()),
        fetch('/api/cmdb/alerts/stats').then(r => r.json())
      ])
      overview = o.data || o
      alertStats = a.data || a
    } catch {}
    let topo = { nodes: [], edges: [] }
    try {
      const t = await fetch('/api/mock/topology').then(r => r.json())
      topo = t.data || t
    } catch {}
    const context = {
      route: route.path,
      title: document.title || '',
      overview,
      alertStats,
      topology: {
        nodes: topo.nodes?.map(n => n.id) || [],
        edges: topo.edges?.map(e => `${e.source}→${e.target} (${e.label||''})`) || [],
      },
    }
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.value.map(m => ({ role: m.role, content: m.content })), context })
    })
    const data = await res.json()
    if (data.reply || data.actions?.length) {
      const reply = (data.reply || '') + ' ' + JSON.stringify(data.actions || [])
      const matched = topoNodes.filter(n => reply.includes(n))
      const actions = [...(data.actions || [])]
      matched.slice(0, 1).forEach(n => {
        if (!actions.some(a => a.label.includes(n))) {
          actions.push({ label: `查看${n}拓扑`, prompt: `跳转到${n}的拓扑高亮页面` })
        }
      })
      actions.sort((a, b) => {
        const aScore = /查看.+?详情/.test(a.label) ? 0 : 1
        const bScore = /查看.+?详情/.test(b.label) ? 0 : 1
        return aScore - bScore
      })
      messages.value.push({ role: 'assistant', content: data.reply || '请选择以下操作：', actions })
      if (matched.length) {
        setTopoHighlight({ nodes: matched })
      }
    } else {
      messages.value.push({ role: 'assistant', content: '抱歉，AI 服务暂时不可用。' })
    }
  } catch {
    messages.value.push({ role: 'assistant', content: '请求失败，请检查网络连接。' })
  }
  loading.value = false
  scrollToBottom()
}

async function analyzePage() {
  open.value = true
  const pageName = route.path === '/' ? '首页' : route.path
  inputText.value = `分析当前页面 ${pageName} 的监控数据和关键指标，给出总结`
  await sendMessage()
}

async function askPromQL() {
  open.value = true
  inputText.value = '帮我写一个 PromQL 查询语句'
  await sendMessage()
}

async function summarizeAlerts() {
  open.value = true
  inputText.value = ''
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/alerts/stats')
    const stats = await res.json()
    inputText.value = `总结当前告警情况，数据：${JSON.stringify(stats)}`
    loading.value = false
    await sendMessage()
  } catch {
    messages.value.push({ role: 'assistant', content: '获取告警数据失败。' })
    loading.value = false
  }
}

async function detectFaults() {
  open.value = true
  inputText.value = ''
  loading.value = true
  try {
    const [alertRes, topoRes] = await Promise.all([
      fetch('/api/mock/alerts').then(r => r.json()),
      fetch('/api/mock/topology').then(r => r.json())
    ])
    const alerts = alertRes.data || alertRes
    const topo = topoRes.data || topoRes
    const alertText = alerts.map(a => `  ${a.node} | ${a.metric} | ${a.value} | ${a.level}`).join('\n')
    const nodeText = (topo.nodes||[]).map(n => n.id).join(', ')
    inputText.value = '检测系统故障。\n\n当前告警：\n' + alertText + '\n\n拓扑节点：' + nodeText + '\n\n请分析是否存在关联故障，定位根因节点，给出修复建议。'
    loading.value = false
    await sendMessage()
  } catch {
    messages.value.push({ role: 'assistant', content: '获取故障检测数据失败。' })
    loading.value = false
  }
}

function runAction(act) {
  const topoMatch = (act.label || '').match(/查看(.+?)拓扑/)
  if (topoMatch) {
    const nodeId = topoMatch[1]
    setTopoHighlight({ nodes: [nodeId] })
    if (nodeId.startsWith('prod-order')) {
      router.push('/monitor/topology?tab=application&appTab=order')
    } else if (nodeId.startsWith('prod-pay')) {
      router.push('/monitor/topology?tab=application&appTab=payment')
    } else if (nodeId.startsWith('prod-user')) {
      router.push('/monitor/topology?tab=application&appTab=user')
    } else {
      router.push('/monitor/topology?tab=application&appTab=all')
    }
    return
  }

  const detailMatch = (act.label || '').match(/查看(.+?)详情/)
  if (detailMatch) {
    openNodeDetail(detailMatch[1])
    return
  }

  inputText.value = act.prompt || act.label
  sendMessage()
}

async function openNodeDetail(nodeId) {
  try {
    const res = await fetch(`/api/mock/node/${nodeId}/metrics`)
    const data = await res.json()
    if (data.success) {
      nodeDetailData.value = data.data
      nodeDetailOpen.value = true
    }
  } catch {}
}

function openFixConfirm(action, nodeId) {
  fixAction.value = action
  fixNodeId.value = nodeId
  fixLoading.value = false
  verifyResult.value = null
  fixProgressText.value = ''
  const labels = { restart: '重启服务', scale: '扩容实例', ratelimit: '限流降级', 'flush-cache': '清除缓存' }
  fixActionLabel.value = labels[action] || action
  fixConfirmOpen.value = true
}

async function executeFix() {
  fixLoading.value = true
  fixProgressText.value = '正在执行修复操作...'
  try {
    const res = await fetch(`/api/mock/fix/${fixAction.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: fixNodeId.value })
    })
    const data = await res.json()
    if (data.success) {
      fixProgressText.value = '修复完成，正在验证恢复...'
      await new Promise(r => setTimeout(r, 800))
      const vRes = await fetch(`/api/mock/verify/${fixNodeId.value}`)
      const vData = await vRes.json()
      if (vData.success) {
        verifyResult.value = vData.data
        nodeDetailData.value = { ...nodeDetailData.value, status: vData.data.status, metrics: vData.data.metrics }
        const before = vData.data.before || {}
        const after = vData.data.metrics || {}
        const metricsText = Object.keys(after).map(k => `${metricLabel(k)} ${before[k] || '-'}→${after[k]}`).join(', ')
        messages.value.push({
          role: 'assistant',
          content: `✅ **修复完成**\n\n节点 ${fixNodeId.value} 已执行「${fixActionLabel.value}」，状态 ${vData.data.status}。\n\n指标恢复：${metricsText}`,
          actions: [{
            label: '一键整理故障处理经验',
            prompt: `整理故障处理经验文档。故障节点：${fixNodeId.value}，告警指标：${metricsText}，执行操作：${fixActionLabel.value}，结果：成功恢复。请生成结构化的故障处理报告，包含：故障概述、影响范围、根因分析、处理步骤、恢复结果、经验总结、预防建议。`
          }]
        })
        scrollToBottom()
        refreshTopology()
      }
    }
  } catch {}
  fixLoading.value = false
}

function openPanel() {
  open.value = true
}
</script>

<style scoped>
.ai-fab {
  position: fixed; bottom: 80px; right: 24px; width: 48px; height: 48px;
  border-radius: 50%; background: var(--brand, #007DFF); color: #FFF;
  border: none; box-shadow: 0 4px 16px rgba(0,125,255,0.35);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 9999; font-size: 20px;
  transition: transform 0.2s var(--ease, cubic-bezier(0.16,1,0.3,1)), box-shadow 0.2s;
}
.ai-fab:active { transform: scale(0.92); }
.ai-fab:hover { box-shadow: 0 6px 20px rgba(0,125,255,0.45); }

.ai-panel {
  position: fixed; top: 0; right: 0; bottom: 0; left: 0;
  z-index: 9998; pointer-events: none; opacity: 0;
  transition: opacity 0.3s;
}
.ai-panel.open { pointer-events: auto; opacity: 1; }
.ai-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.2);
}
.ai-panel-content {
  position: absolute; top: 0; right: -420px; width: 420px;
  height: 100%; background: #fff;
  box-shadow: -2px 0 12px rgba(0,0,0,0.12);
  transition: right 0.3s var(--ease, cubic-bezier(0.16,1,0.3,1));
  display: flex; flex-direction: column;
}
.ai-panel.open .ai-panel-content { right: 0; }

.ai-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border, #E5E5EA);
  flex-shrink: 0;
}
.ai-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.ai-header h3 i { margin-right: 8px; color: var(--brand, #007DFF); }
.close-btn {
  width: 28px; height: 28px; border: none; background: transparent;
  color: var(--text-ter, #9CA3AF); cursor: pointer; font-size: 18px;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: var(--bg-sec, #F2F2F7); color: var(--text, #182431); }

.ai-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.ai-welcome { text-align: center; padding: 40px 20px 20px; }
.welcome-icon { font-size: 40px; color: var(--brand, #007DFF); margin-bottom: 12px; }
.welcome-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.welcome-desc { font-size: 13px; color: var(--text-sec, #6B7280); margin-bottom: 24px; }
.quick-actions { display: flex; flex-direction: column; gap: 8px; }
.quick-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border: 1px solid var(--border, #E5E5EA);
  border-radius: 8px; background: var(--bg, #FFF);
  color: var(--text, #182431); cursor: pointer; font-size: 13px;
  transition: all 0.15s;
}
.quick-btn:hover { border-color: var(--brand, #007DFF); background: var(--brand-subtle, #EBF4FF); color: var(--brand, #007DFF); }
.quick-btn i { font-size: 14px; }

.ai-msg { display: flex; gap: 10px; }
.ai-msg.user { flex-direction: row-reverse; }
.msg-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: #FFF; flex-shrink: 0;
}
.ai-msg.user .msg-avatar { background: var(--brand, #007DFF); }
.ai-msg.assistant .msg-avatar { background: #6B7280; }
.msg-content { max-width: 80%; min-width: 0; }
.msg-bubble {
  padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6;
}
.ai-msg.user .msg-bubble {
  background: var(--brand, #007DFF); color: #FFF;
  border-bottom-right-radius: 4px;
}
.ai-msg.assistant .msg-bubble {
  background: var(--bg-sec, #F2F2F7); color: var(--text, #182431);
  border-bottom-left-radius: 4px;
}
.msg-bubble.thinking { min-width: 40px; display: flex; align-items: center; justify-content: center; }

.md-content { font-size: 13px; line-height: 1.7; }
.md-content h1, .md-content h2, .md-content h3, .md-content h4 { margin: 12px 0 6px; font-weight: 600; }
.md-content h1 { font-size: 16px; }
.md-content h2 { font-size: 15px; }
.md-content h3 { font-size: 14px; }
.md-content p { margin: 6px 0; }
.md-content ul, .md-content ol { margin: 4px 0; padding-left: 0; list-style-position: inside; }
.md-content li { margin: 2px 0; }
.md-content strong { font-weight: 600; }
.md-content code {
  background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px;
  font-size: 12px; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
.md-content pre {
  background: rgba(0,0,0,0.04); padding: 10px 12px; border-radius: 8px;
  overflow-x: auto; margin: 8px 0;
}
.md-content pre code { background: none; padding: 0; font-size: 12px; }
.md-content table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
.md-content th, .md-content td {
  border: 1px solid var(--border, #E5E5EA); padding: 6px 10px; text-align: left;
}
.md-content th { background: var(--bg-sec, #F2F2F7); font-weight: 600; }
.md-content hr { border: none; border-top: 1px solid var(--border, #E5E5EA); margin: 12px 0; }
.md-content blockquote {
  border-left: 3px solid var(--brand, #007DFF); padding: 6px 12px; margin: 8px 0;
  color: var(--text-sec, #6B7280); background: var(--brand-subtle, #EBF4FF); border-radius: 0 6px 6px 0;
}
.msg-bubble.thinking i { animation: pulse 1.2s infinite; color: var(--text-ter, #9CA3AF); }
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

.ai-footer {
  flex-shrink: 0; border-top: 1px solid var(--border, #E5E5EA);
  padding: 12px 20px;
}
.input-row { display: flex; gap: 8px; }
.ai-input {
  flex: 1; height: 38px; padding: 0 12px; border: 1px solid var(--border, #E5E5EA);
  border-radius: 8px; font-size: 13px; outline: none;
  transition: border-color 0.15s;
}
.ai-input:focus { border-color: var(--brand, #007DFF); }
.send-btn {
  width: 38px; height: 38px; border-radius: 8px; border: none;
  background: var(--brand, #007DFF); color: #FFF; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: opacity 0.15s;
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { background: var(--brand-hover, #0066D6); }

.msg-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.action-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: 1px solid var(--brand, #007DFF);
  border-radius: 6px; background: var(--brand-subtle, #EBF4FF);
  color: var(--brand, #007DFF); cursor: pointer; font-size: 12px;
  transition: all 0.15s; white-space: nowrap;
}
.action-btn:hover { background: var(--brand, #007DFF); color: #FFF; }
.action-btn i { font-size: 11px; }

@media (max-width: 768px) {
  .ai-fab { bottom: 70px; right: 16px; width: 44px; height: 44px; font-size: 18px; }
  .ai-panel-content { width: 100%; right: -100%; }
}

/* 节点详情面板 */
.node-detail-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.3); opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.node-detail-overlay.open { opacity: 1; pointer-events: auto; }
.node-detail-panel {
  position: absolute; top: 0; right: -480px; width: 460px; height: 100%;
  background: #fff; box-shadow: -4px 0 20px rgba(0,0,0,0.15);
  transition: right 0.3s var(--ease, cubic-bezier(0.16,1,0.3,1));
  display: flex; flex-direction: column;
}
.node-detail-overlay.open .node-detail-panel { right: 0; }
.nd-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border, #E5E5EA);
}
.nd-header h3 { margin: 0; font-size: 17px; font-weight: 600; }
.nd-id { font-size: 12px; color: var(--text-ter, #9CA3AF); margin-top: 2px; display: block; }
.nd-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
.nd-status-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.nd-type { font-size: 13px; color: var(--text-sec, #6B7280); }
.status-tag {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 500;
}
.status-critical { background: #FEE2E2; color: #DC2626; }
.status-warning { background: #FEF3C7; color: #D97706; }
.status-normal { background: #D1FAE5; color: #059669; }
.status-tag-sm {
  display: inline-flex; padding: 1px 6px; border-radius: 4px;
  font-size: 11px; font-weight: 500;
}
.nd-section { margin-bottom: 20px; }
.nd-section-title {
  font-size: 13px; font-weight: 600; color: var(--text, #182431);
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.nd-section-title i { color: var(--brand, #007DFF); font-size: 12px; }
.nd-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.nd-metric-card {
  background: var(--bg-sec, #F2F2F7); border-radius: 8px; padding: 10px 12px; text-align: center;
}
.metric-val { font-size: 16px; font-weight: 700; color: var(--text, #182431); }
.metric-label { font-size: 11px; color: var(--text-ter, #9CA3AF); margin-top: 2px; }
.nd-alert-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 0;
  border-bottom: 1px solid var(--border, #E5E5EA); font-size: 12px;
}
.nd-alert-item:last-child { border-bottom: none; }
.alert-time { color: var(--text-ter, #9CA3AF); min-width: 55px; }
.alert-metric { font-weight: 500; }
.alert-value { color: var(--text-sec, #6B7280); }
.nd-deps { font-size: 12px; }
.nd-deps > div { margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.dep-label { color: var(--text-ter, #9CA3AF); min-width: 30px; }
.dep-node {
  background: var(--bg-sec, #F2F2F7); padding: 2px 8px; border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace; font-size: 11px;
}
.dep-center { font-weight: 600; color: var(--brand, #007DFF); }
.nd-fix-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.fix-action-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: 1px solid var(--border, #E5E5EA);
  border-radius: 8px; background: #fff; color: var(--text, #182431);
  cursor: pointer; font-size: 13px; transition: all 0.15s;
}
.fix-action-btn:hover { border-color: var(--brand, #007DFF); color: var(--brand, #007DFF); background: var(--brand-subtle, #EBF4FF); }

/* 修复确认弹窗 */
.fix-confirm-overlay {
  position: fixed; inset: 0; z-index: 10001;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
}
.fix-confirm-dialog {
  background: #fff; border-radius: 12px; width: 400px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.fix-confirm-header {
  padding: 16px 20px; border-bottom: 1px solid var(--border, #E5E5EA);
  font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px;
}
.fix-confirm-header i { color: #D97706; }
.fix-confirm-body { padding: 20px; min-height: 80px; }
.fix-confirm-body p { margin: 0 0 8px; font-size: 14px; line-height: 1.6; }
.fix-warning { color: var(--text-ter, #9CA3AF); font-size: 12px !important; }
.fix-progress { text-align: center; }
.fix-spinner {
  width: 36px; height: 36px; border: 3px solid var(--border, #E5E5EA);
  border-top-color: var(--brand, #007DFF); border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.fix-verify { text-align: center; }
.verify-icon { font-size: 32px; margin-bottom: 8px; }
.verify-icon.success { color: #059669; }
.verify-icon.warning { color: #D97706; }
.verify-title { font-weight: 600; font-size: 15px; margin-bottom: 12px; }
.verify-table { width: 100%; font-size: 12px; border-collapse: collapse; }
.verify-row { display: flex; border-bottom: 1px solid var(--border, #E5E5EA); }
.verify-row > span { flex: 1; padding: 6px 8px; }
.verify-header { font-weight: 600; background: var(--bg-sec, #F2F2F7); }
.val-before { color: #DC2626; }
.val-after { color: #059669; font-weight: 600; }
.fix-confirm-footer {
  padding: 12px 20px; border-top: 1px solid var(--border, #E5E5EA);
  display: flex; justify-content: flex-end; gap: 8px;
}
.btn-cancel {
  padding: 8px 16px; border: 1px solid var(--border, #E5E5EA);
  border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px;
}
.btn-confirm {
  padding: 8px 16px; border: none; border-radius: 8px;
  background: var(--brand, #007DFF); color: #fff; cursor: pointer; font-size: 13px;
}
.btn-confirm:hover { background: var(--brand-hover, #0066D6); }
</style>