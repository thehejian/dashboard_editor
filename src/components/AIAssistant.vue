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
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text, { breaks: true, gfm: true })
}

const route = useRoute()
const open = ref(false)
const loading = ref(false)
const inputText = ref('')
const messages = ref([])
const bodyRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
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
    const context = {
      route: route.path,
      title: document.title || '',
      overview,
      alertStats,
    }
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.value.map(m => ({ role: m.role, content: m.content })), context })
    })
    const data = await res.json()
    if (data.reply || data.actions?.length) {
      messages.value.push({ role: 'assistant', content: data.reply || '请选择以下操作：', actions: data.actions })
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

function runAction(act) {
  inputText.value = act.prompt || act.label
  sendMessage()
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
</style>