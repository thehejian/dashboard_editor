<template>
  <div class="ai-dashboard">
    <div class="ai-toolbar">
      <div class="ai-toolbar-left">
        <button class="ai-test-btn" :class="{ testing }" @click="runTest" :disabled="testing">
          <i class="fa-solid fa-plug" :class="{ 'fa-spin': testing }"></i>
          <span>{{ testing ? '测试中...' : '测试连接' }}</span>
        </button>
      </div>
      <div class="ai-toolbar-right">
        <span v-if="lastTestTime" class="ai-last-test">最后测试: {{ lastTestTime }}</span>
      </div>
    </div>

    <div class="ai-row ai-row-agnes">
      <div class="ai-provider-card" v-for="group in agnesGroups" :key="group.key">
        <div class="ai-provider-header">
          <div class="ai-provider-icon" :style="{ background: group.color }">
            <i :class="group.icon"></i>
          </div>
          <div class="ai-provider-info">
            <div class="ai-provider-name">{{ group.provider }}</div>
            <div class="ai-provider-meta">Token: {{ group.tokenLabel }}</div>
          </div>
          <div class="ai-provider-stats">
            <span class="ai-stat-pill ai-stat-ok" v-if="group.successCount > 0">{{ group.successCount }} 正常</span>
            <span class="ai-stat-pill ai-stat-error" v-if="group.errorCount > 0">{{ group.errorCount }} 异常</span>
          </div>
        </div>
        <table class="ai-model-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>状态</th>
              <th>时延</th>
              <th>错误信息</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in group.models" :key="m.model">
              <td class="ai-td-model">{{ m.model }}</td>
              <td>
                <span v-if="m.status === 'pending'" class="ai-status-tag ai-status-pending">等待测试</span>
                <span v-else-if="m.status === 'testing'" class="ai-status-tag ai-status-testing">测试中</span>
                <span v-else-if="m.status === 'success'" class="ai-status-tag ai-status-success">正常</span>
                <span v-else class="ai-status-tag ai-status-error">异常</span>
              </td>
              <td class="ai-td-latency">
                <span v-if="m.latencyMs != null" :class="getLatencyClass(m.latencyMs)">{{ m.latencyMs }}ms</span>
                <span v-else class="ai-td-na">—</span>
              </td>
              <td class="ai-td-error">
                <span v-if="m.errorMessage" class="ai-error-text">{{ m.errorMessage }}</span>
                <span v-else class="ai-td-na">—</span>
              </td>
              <td>
                <button class="ai-single-test-btn" @click="testSingle(m)" :disabled="m.status === 'testing' || testing">
                  <i class="fa-solid fa-play"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="ai-row ai-row-other">
      <div class="ai-provider-card" v-for="group in otherGroups" :key="group.key">
        <div class="ai-provider-header">
          <div class="ai-provider-icon" :style="{ background: group.color }">
            <i :class="group.icon"></i>
          </div>
          <div class="ai-provider-info">
            <div class="ai-provider-name">{{ group.provider }}</div>
          </div>
          <div class="ai-provider-stats">
            <span class="ai-stat-pill ai-stat-ok" v-if="group.successCount > 0">{{ group.successCount }} 正常</span>
            <span class="ai-stat-pill ai-stat-error" v-if="group.errorCount > 0">{{ group.errorCount }} 异常</span>
          </div>
        </div>
        <table class="ai-model-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>状态</th>
              <th>时延</th>
              <th>错误信息</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in group.models" :key="m.model">
              <td class="ai-td-model">{{ m.model }}</td>
              <td>
                <span v-if="m.status === 'pending'" class="ai-status-tag ai-status-pending">等待测试</span>
                <span v-else-if="m.status === 'testing'" class="ai-status-tag ai-status-testing">测试中</span>
                <span v-else-if="m.status === 'success'" class="ai-status-tag ai-status-success">正常</span>
                <span v-else class="ai-status-tag ai-status-error">异常</span>
              </td>
              <td class="ai-td-latency">
                <span v-if="m.latencyMs != null" :class="getLatencyClass(m.latencyMs)">{{ m.latencyMs }}ms</span>
                <span v-else class="ai-td-na">—</span>
              </td>
              <td class="ai-td-error">
                <span v-if="m.errorMessage" class="ai-error-text">{{ m.errorMessage }}</span>
                <span v-else class="ai-td-na">—</span>
              </td>
              <td>
                <button class="ai-single-test-btn" @click="testSingle(m)" :disabled="m.status === 'testing' || testing">
                  <i class="fa-solid fa-play"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const testing = ref(false)
const lastTestTime = ref('')

const STORAGE_KEY = 'ai-model-states'
const TIME_KEY = 'ai-last-test-time'

const allModels = [
  { provider: 'Agnes', tokenLabel: 'thehejian', model: 'agnes-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'thehejian', model: 'agnes-image-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'thehejian', model: 'agnes-image-2.1-flash' },
  { provider: 'Agnes', tokenLabel: 'thehejian', model: 'agnes-video-v2.0' },
  { provider: 'Agnes', tokenLabel: 'Google', model: 'agnes-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'Google', model: 'agnes-image-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'Google', model: 'agnes-image-2.1-flash' },
  { provider: 'Agnes', tokenLabel: 'Google', model: 'agnes-video-v2.0' },
  { provider: 'Agnes', tokenLabel: 'github', model: 'agnes-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'github', model: 'agnes-image-2.0-flash' },
  { provider: 'Agnes', tokenLabel: 'github', model: 'agnes-image-2.1-flash' },
  { provider: 'Agnes', tokenLabel: 'github', model: 'agnes-video-v2.0' },
  { provider: 'SenseNova', tokenLabel: null, model: 'sensenova-6.7-flash-lite' },
  { provider: 'SenseNova', tokenLabel: null, model: 'sensenova-u1-fast' },
  { provider: 'SenseNova', tokenLabel: null, model: 'deepseek-v4-flash' },
  { provider: 'Zhipu GLM', tokenLabel: null, model: 'glm-4.7-flash' },
]

function buildDefaultStates() {
  return allModels.map(m => ({ ...m, status: 'pending', latencyMs: null, errorMessage: null }))
}

const modelStates = ref(buildDefaultStates())

function restoreFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      modelStates.value = allModels.map(m => {
        const match = parsed.find(p => {
          const pKey = p.tokenLabel ? `${p.provider}-${p.tokenLabel}` : p.provider
          const mKey = m.tokenLabel ? `${m.provider}-${m.tokenLabel}` : m.provider
          return pKey === mKey && p.model === m.model
        })
        return match || { ...m, status: 'pending', latencyMs: null, errorMessage: null }
      })
    }
    const savedTime = localStorage.getItem(TIME_KEY)
    if (savedTime) lastTestTime.value = savedTime
  } catch { /* ignore */ }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modelStates.value))
    localStorage.setItem(TIME_KEY, lastTestTime.value)
  } catch { /* ignore */ }
}

function computeGroup(provider, tokenLabel) {
  const models = modelStates.value.filter(m => {
    if (tokenLabel) return m.provider === provider && m.tokenLabel === tokenLabel
    return m.provider === provider && m.tokenLabel === null
  })
  const key = tokenLabel ? `${provider}-${tokenLabel}` : provider
  return {
    key,
    provider,
    tokenLabel,
    models,
    color: getColor(provider),
    icon: getIcon(provider),
    successCount: models.filter(m => m.status === 'success').length,
    errorCount: models.filter(m => m.status === 'error').length,
  }
}

const agnesGroups = computed(() => [
  computeGroup('Agnes', 'thehejian'),
  computeGroup('Agnes', 'Google'),
  computeGroup('Agnes', 'github'),
])

const otherGroups = computed(() => [
  computeGroup('SenseNova', null),
  computeGroup('Zhipu GLM', null),
])

function getColor(provider) {
  const colors = {
    Agnes: 'linear-gradient(135deg, #1890ff, #096dd9)',
    SenseNova: 'linear-gradient(135deg, #722ed1, #531dab)',
    'Zhipu GLM': 'linear-gradient(135deg, #13c2c2, #08979c)',
  }
  return colors[provider] || 'linear-gradient(135deg, #8c8c8c, #595959)'
}

function getIcon(provider) {
  const icons = {
    Agnes: 'fa-solid fa-robot',
    SenseNova: 'fa-solid fa-brain',
    'Zhipu GLM': 'fa-solid fa-microchip',
  }
  return icons[provider] || 'fa-solid fa-server'
}

function getLatencyClass(ms) {
  if (ms < 1000) return 'ai-latency-ok'
  if (ms < 3000) return 'ai-latency-warn'
  return 'ai-latency-danger'
}

function applyResult(r) {
  const key = r.tokenLabel ? `${r.provider}-${r.tokenLabel}` : r.provider
  const target = modelStates.value.find(m => {
    const mKey = m.tokenLabel ? `${m.provider}-${m.tokenLabel}` : m.provider
    return mKey === key && m.model === r.model
  })
  if (target) {
    target.status = r.status
    target.latencyMs = r.latencyMs
    target.errorMessage = r.errorMessage || null
  }
}

async function runTest() {
  testing.value = true
  modelStates.value.forEach(m => { m.status = 'testing'; m.latencyMs = null; m.errorMessage = null })
  try {
    const res = await fetch('/api/ai/test-connection', { method: 'POST' })
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const r = JSON.parse(data)
            applyResult(r)
          } catch { /* ignore parse errors */ }
        }
      }
    }
    lastTestTime.value = new Date().toLocaleString()
    persistState()
  } catch (e) {
    console.error('Test connection failed:', e)
  } finally {
    testing.value = false
  }
}

async function testSingle(m) {
  m.status = 'testing'
  m.latencyMs = null
  m.errorMessage = null
  try {
    const res = await fetch('/api/ai/test-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: m.provider, tokenLabel: m.tokenLabel, model: m.model }),
    })
    const r = await res.json()
    applyResult({ provider: m.provider, tokenLabel: m.tokenLabel, model: m.model, ...r })
    persistState()
  } catch (e) {
    m.status = 'error'
    m.errorMessage = e.message || '连接失败'
  }
}

onMounted(() => {
  restoreFromStorage()
})
</script>

<style scoped>
.ai-dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 12px;
}

/* Toolbar */
.ai-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 4px;
}
.ai-toolbar-left, .ai-toolbar-right { display: flex; align-items: center; gap: 10px; }
.ai-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0; }
.ai-test-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 16px;
  border: none;
  background: #1890ff;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.ai-test-btn:hover { background: #40a9ff; }
.ai-test-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-test-btn.testing { background: #fa8c16; }
.ai-last-test { font-size: 11px; color: #8c8c8c; }

/* Rows */
.ai-row {
  display: flex;
  gap: 16px;
}
.ai-row-agnes .ai-provider-card { flex: 1; min-width: 0; }
.ai-row-other .ai-provider-card { flex: 1; min-width: 0; }

/* Provider Card */
.ai-provider-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.ai-provider-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.ai-provider-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-provider-icon i { font-size: 14px; color: #fff; }
.ai-provider-info { flex: 1; min-width: 0; }
.ai-provider-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.ai-provider-meta { font-size: 11px; color: #8c8c8c; margin-top: 1px; }
.ai-provider-stats { display: flex; gap: 4px; flex-shrink: 0; }
.ai-stat-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.ai-stat-ok { background: #f6ffed; color: #52c41a; }
.ai-stat-error { background: #fff2f0; color: #f5222d; }

/* Table */
.ai-model-table {
  width: 100%;
  border-collapse: collapse;
}
.ai-model-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  color: #8c8c8c;
  padding: 7px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.ai-model-table td {
  padding: 8px 16px;
  font-size: 12px;
  color: #1a1a1a;
  border-bottom: 1px solid #f5f5f5;
}
.ai-model-table tr:last-child td { border-bottom: none; }
.ai-model-table tr:hover td { background: #fafafa; }
.ai-td-model { font-weight: 500; white-space: nowrap; }
.ai-td-na { color: #d9d9d9; }
.ai-td-error { max-width: 180px; }
.ai-error-text { font-size: 11px; color: #f5222d; word-break: break-all; }

/* Single Test Button */
.ai-single-test-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #8c8c8c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.ai-single-test-btn:hover { border-color: #1890ff; color: #1890ff; }
.ai-single-test-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Status Tags */
.ai-status-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
}
.ai-status-pending { background: #f5f5f5; color: #8c8c8c; }
.ai-status-testing { background: #fff7e6; color: #fa8c16; }
.ai-status-success { background: #f6ffed; color: #52c41a; }
.ai-status-error { background: #fff2f0; color: #f5222d; }

/* Latency */
.ai-latency-ok { color: #52c41a; font-weight: 600; }
.ai-latency-warn { color: #fa8c16; font-weight: 600; }
.ai-latency-danger { color: #f5222d; font-weight: 600; }

/* Responsive */
@media (max-width: 900px) {
  .ai-row { flex-direction: column; }
}
@media (max-width: 768px) {
  .ai-toolbar { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
