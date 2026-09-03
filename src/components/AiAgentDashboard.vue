<template>
  <div class="aad">
    <div class="aad-toolbar">
      <div class="aad-toolbar-left">
        <div class="aad-time-pills">
          <button class="aad-time-pill" :class="{ active: period === '1h' }" @click="period = '1h'">1h</button>
          <button class="aad-time-pill" :class="{ active: period === '6h' }" @click="period = '6h'">6h</button>
          <button class="aad-time-pill" :class="{ active: period === '24h' }" @click="period = '24h'">24h</button>
          <button class="aad-time-pill" :class="{ active: period === '7d' }" @click="period = '7d'">7d</button>
          <button class="aad-time-pill" :class="{ active: period === '30d' }" @click="period = '30d'">30d</button>
        </div>
      </div>
      <div class="aad-toolbar-right">
        <a-dropdown :trigger="['click']" class="refresh-dropdown">
          <button class="aad-refresh-btn">
            <i class="fa-solid fa-rotate"></i>
            <span>{{ refreshRate === '0' ? '自动刷新' : refreshOptions.find(r => r.value === refreshRate)?.label }}</span>
          </button>
          <template #overlay>
            <a-menu>
              <a-menu-item v-for="opt in refreshOptions" :key="opt.value" @click="setRefreshRate(opt.value)">
                {{ opt.label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <span v-if="lastRefresh" class="aad-last-refresh">最后更新: {{ lastRefresh }}</span>
      </div>
    </div>

    <!-- Hero Metrics -->
    <div class="aad-hero">
      <div class="aad-hero-card" v-for="m in heroMetrics" :key="m.label">
        <div class="aad-hero-label">{{ m.label }}</div>
        <div class="aad-hero-value">{{ m.value }}<span class="aad-hero-unit">{{ m.unit }}</span></div>
        <div class="aad-hero-trend" :class="m.trend > 0 ? 'up' : 'down'">
          <span class="aad-hero-trend-val">{{ Math.abs(m.trend) }}%</span>
          <span class="aad-hero-trend-arrow">{{ m.trend > 0 ? '↑' : '↓' }}</span>
          <span class="aad-hero-trend-label">日同比</span>
        </div>
      </div>
    </div>

    <!-- Active AI Agent -->
    <div class="aad-agent-wrapper">
      <div class="aad-section-title">活跃 AI Agent</div>
      <div class="aad-agent-grid">
        <div class="aad-agent-card" v-for="a in agentCards" :key="a.name" @click="a.expanded = !a.expanded">
          <div class="aad-agent-header">
            <span class="aad-agent-name">{{ a.name }}</span>
            <span class="aad-agent-arrow">→</span>
          </div>
          <div class="aad-agent-body">
            <div class="aad-agent-row">
              <span class="aad-agent-label">告警状态</span>
              <a-tag :color="a.status === 'ok' ? 'success' : 'error'" size="small">{{ a.status === 'ok' ? '🟢正常' : '🔴紧急' }}</a-tag>
            </div>
            <div class="aad-agent-row"><span>错误/请求</span><span>{{ a.errors }}/{{ a.requests }}</span></div>
            <div class="aad-agent-row"><span>Token消耗</span><span>{{ a.tokenConsumption }}</span></div>
            <div class="aad-agent-row"><span>平均耗时</span><span>{{ a.avgLatency }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent Stats Charts Row 1 -->
    <div class="aad-charts-row">
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent 调用量统计</div>
        <div class="aad-donut-wrap">
          <div class="aad-donut-center">
            <div class="aad-donut-total">{{ formatNum(agentCallTotal) }}</div>
            <div class="aad-donut-sub">AI Agent 调用量</div>
          </div>
          <div :ref="el => setRef('agentCallDonut', el)" class="aad-g2-chart"></div>
        </div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent Token消耗 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('agentTokenTop5', el)" class="aad-g2-chart aad-g2-bar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent调用量 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('agentCallTop5', el)" class="aad-g2-chart aad-g2-bar"></div>
      </div>
    </div>

    <!-- Agent Stats Charts Row 2 -->
    <div class="aad-charts-row">
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent 平均耗时 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('agentAvgTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent TTFT Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('agentTtftTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent TPOT Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('agentTpotTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
    </div>

    <!-- Model Stats Charts Row 1 -->
    <div class="aad-section">
      <div class="aad-section-title">模型Token消耗统计</div>
    </div>
    <div class="aad-charts-row">
      <div class="aad-chart-box">
        <div class="aad-chart-title">AI Agent 调用量统计</div>
        <div class="aad-donut-wrap">
          <div class="aad-donut-center">
            <div class="aad-donut-total">{{ formatNum(modelTokenTotal) }}</div>
            <div class="aad-donut-sub">Token 消耗</div>
          </div>
          <div :ref="el => setRef('modelTokenDonut', el)" class="aad-g2-chart"></div>
        </div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">模型Token消耗 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('modelTokenTop5', el)" class="aad-g2-chart aad-g2-bar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">模型调用量 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('modelCallTop5', el)" class="aad-g2-chart aad-g2-bar"></div>
      </div>
    </div>

    <!-- Model Stats Charts Row 2 -->
    <div class="aad-charts-row">
      <div class="aad-chart-box">
        <div class="aad-chart-title">模型平均耗时 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('modelAvgTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">模型TTFT Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('modelTtftTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">模型TPOT Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('modelTpotTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
    </div>

    <!-- User Stats -->
    <div class="aad-section">
      <div class="aad-section-title">活跃用户统计</div>
    </div>
    <div class="aad-charts-row">
      <div class="aad-chart-box">
        <div class="aad-chart-title">用户Token消耗 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('userTokenTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">用户会话数 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('userSessionTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
      <div class="aad-chart-box">
        <div class="aad-chart-title">用户模型使用 Top5 <span class="aad-dropdown">降序 ▼</span></div>
        <div :ref="el => setRef('userModelTop5', el)" class="aad-g2-chart aad-g2-hbar"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const charts = {}
const chartRefs = {}

function setRef(key, el) {
  if (el) chartRefs[key] = el
}

const period = ref('24h')
const refreshRate = ref('0')
const lastRefresh = ref('')
const refreshOptions = [
  { value: '0', label: '关闭' },
  { value: '30', label: '30秒' },
  { value: '60', label: '1分钟' },
  { value: '300', label: '5分钟' },
]
let refreshTimer = null
function setRefreshRate(v) {
  refreshRate.value = v
  clearInterval(refreshTimer)
  if (v !== '0') {
    refreshTimer = setInterval(() => { lastRefresh.value = new Date().toLocaleString() }, Number(v) * 1000)
  }
}

const heroMetrics = reactive([
  { label: '活跃Agent数', value: 12, unit: '', trend: -3.5 },
  { label: '活跃会话数', value: 627, unit: '', trend: 5.0 },
  { label: '对话数', value: 3.03, unit: 'K', trend: 2.5 },
  { label: 'Token消耗', value: 190.3, unit: 'Mil', trend: -3.5 },
  { label: '平均TTFT', value: 6.11, unit: 's', trend: 2.5 },
])

const agentCards = reactive([
  { name: 'Product Research', status: 'error', errors: 2, requests: 7, tokenConsumption: '55K', avgLatency: '5.5s', expanded: false },
  { name: 'Analyst Agent', status: 'error', errors: 3, requests: 109, tokenConsumption: '74K', avgLatency: '3.1s', expanded: false },
  { name: 'Opencode', status: 'ok', errors: 0, requests: 98, tokenConsumption: '34K', avgLatency: '8.2s', expanded: false },
  { name: 'DeepSeek Harness', status: 'ok', errors: 0, requests: 98, tokenConsumption: '23K', avgLatency: '6.1s', expanded: false },
  { name: 'qoder-cli', status: 'ok', errors: 0, requests: 598, tokenConsumption: '78K', avgLatency: '3.4s', expanded: false },
  { name: 'CodeTutor', status: 'ok', errors: 0, requests: 16, tokenConsumption: '78K', avgLatency: '7.9s', expanded: false },
  { name: 'Pi', status: 'ok', errors: 0, requests: 612, tokenConsumption: '89K', avgLatency: '1.3s', expanded: false },
  { name: 'Claude Code', status: 'ok', errors: 0, requests: 78, tokenConsumption: '12K', avgLatency: '4.5s', expanded: false },
])

const agentCallData = [
  { name: 'Hermes', value: 34000 },
  { name: 'opencode', value: 26000 },
  { name: 'OpenAI Agent', value: 45000 },
  { name: 'qoder-cli', value: 53000 },
  { name: 'CodeTutor', value: 69000 },
  { name: 'pi', value: 84000 },
  { name: 'claude', value: 82000 },
]
const agentCallTotal = agentCallData.reduce((s, d) => s + d.value, 0)

const agentTokenTop5Data = [
  { name: 'Hermes', input: 900, output: 800 },
  { name: 'opencode', input: 600, output: 600 },
  { name: 'OpenAI Agent', input: 1000, output: 700 },
  { name: 'qoder-cli', input: 400, output: 400 },
  { name: 'CodeTutor', input: 500, output: 500 },
]

const agentCallTop5Data = [
  { name: 'Hermes', calls: 800, errorRate: 2.5 },
  { name: 'opencode', calls: 600, errorRate: 1.8 },
  { name: 'OpenAI Agent', calls: 1000, errorRate: 0.5 },
  { name: 'qoder-cli', calls: 400, errorRate: 3.2 },
  { name: 'CodeTutor', calls: 500, errorRate: 1.0 },
]

const agentAvgTop5Data = [
  { name: 'CodeTutor', value: 600 },
  { name: 'qoder-cli', value: 500 },
  { name: 'OpenAI Agent', value: 400 },
  { name: 'Hermes', value: 300 },
  { name: 'opencode', value: 200 },
]

const agentTtftTop5Data = [
  { name: 'CodeTutor', value: 600 },
  { name: 'qoder-cli', value: 500 },
  { name: 'OpenAI Agent', value: 400 },
  { name: 'Hermes', value: 300 },
  { name: 'opencode', value: 200 },
]

const agentTpotTop5Data = [
  { name: 'CodeTutor', value: 600 },
  { name: 'qoder-cli', value: 500 },
  { name: 'OpenAI Agent', value: 400 },
  { name: 'Hermes', value: 300 },
  { name: 'opencode', value: 200 },
]

const modelTokenData = [
  { name: 'DeepSeek V4', value: 8000000 },
  { name: 'Qwen 3.5', value: 12000000 },
  { name: 'GLM 5.2', value: 9000000 },
  { name: 'Kimi K2.6', value: 6000000 },
  { name: 'Qwen3-Max', value: 62300000 },
  { name: 'Qwen3.6-27B', value: 19000000 },
  { name: 'GLM-5.3-Flash', value: 74000000 },
]
const modelTokenTotal = modelTokenData.reduce((s, d) => s + d.value, 0)

const modelTokenTop5Data = [
  { name: 'qwen-turbo', input: 900, output: 800 },
  { name: 'qwen-plus', input: 600, output: 600 },
  { name: 'deepseek-v4', input: 1000, output: 700 },
  { name: 'glm-5.2', input: 400, output: 400 },
  { name: 'kimi-k3', input: 500, output: 500 },
]

const modelCallTop5Data = [
  { name: 'DeepSeek V4', calls: 800, errorRate: 2.5 },
  { name: 'Qwen3.5', calls: 600, errorRate: 1.8 },
  { name: 'GLM5.2', calls: 1000, errorRate: 0.5 },
  { name: 'Kimi K2.6', calls: 400, errorRate: 3.2 },
  { name: 'Qwen3-Max', calls: 500, errorRate: 1.0 },
]

const modelAvgTop5Data = [
  { name: 'kimi-k3', value: 1000 },
  { name: 'glm-5.2', value: 800 },
  { name: 'deepseek-v4', value: 600 },
  { name: 'qwen-plus', value: 400 },
  { name: 'qwen-turbo', value: 200 },
]

const modelTtftTop5Data = [
  { name: 'kimi-k3', value: 1000 },
  { name: 'glm-5.2', value: 800 },
  { name: 'deepseek-v4', value: 600 },
  { name: 'qwen-plus', value: 400 },
  { name: 'qwen-turbo', value: 200 },
]

const modelTpotTop5Data = [
  { name: 'kimi-k3', value: 1000 },
  { name: 'glm-5.2', value: 800 },
  { name: 'deepseek-v4', value: 600 },
  { name: 'qwen-plus', value: 400 },
  { name: 'qwen-turbo', value: 200 },
]

const userTokenTop5Data = [
  { name: 'yili2', value: 600 },
  { name: 'support-demo', value: 500 },
  { name: 'affic-user-001', value: 400 },
  { name: 'affic-user-ops', value: 300 },
  { name: 'vercel-bot', value: 200 },
]

const userSessionTop5Data = [
  { name: 'yili2', value: 600 },
  { name: 'support-demo', value: 500 },
  { name: 'affic-user-001', value: 400 },
  { name: 'affic-user-ops', value: 300 },
  { name: 'vercel-bot', value: 200 },
]

const userModelTop5Data = [
  { name: 'kimi-k3', value: 1000 },
  { name: 'glm-5.2', value: 800 },
  { name: 'deepseek-v4', value: 600 },
  { name: 'qwen-plus', value: 400 },
  { name: 'qwen-turbo', value: 200 },
]

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

function destroyAll() {
  Object.values(charts).forEach(c => { try { c.destroy() } catch(e) {} })
  Object.keys(charts).forEach(k => { delete charts[k] })
}

function renderDonut(key, data) {
  const container = chartRefs[key]
  if (!container) return
  if (charts[key]) { try { charts[key].destroy() } catch(e) {} }
  const c = new Chart({ container, autoFit: true, height: 200 })
  c.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  c.data(data)
  c.interval().encode('y', 'value').encode('color', 'name')
  c.render()
  charts[key] = c
}

function renderStackedBar(key, data) {
  const container = chartRefs[key]
  if (!container) return
  if (charts[key]) { try { charts[key].destroy() } catch(e) {} }
  const stacked = []
  data.forEach(d => {
    stacked.push({ name: d.name, type: '输入', value: d.input })
    stacked.push({ name: d.name, type: '输出', value: d.output })
  })
  const c = new Chart({ container, autoFit: true, height: 200 })
  c.interval().data(stacked)
    .encode('x', 'name').encode('y', 'value').encode('color', 'type')
    .transform({ type: 'stackY' })
  c.render()
  charts[key] = c
}

function renderBarLine(key, data) {
  const container = chartRefs[key]
  if (!container) return
  if (charts[key]) { try { charts[key].destroy() } catch(e) {} }
  const c = new Chart({ container, autoFit: true, height: 200 })
  c.interval().data(data)
    .encode('x', 'name').encode('y', 'calls')
  c.line().data(data)
    .encode('x', 'name').encode('y', d => d.errorRate * 10)
  c.render()
  charts[key] = c
}

function renderHBar(key, data) {
  const container = chartRefs[key]
  if (!container) return
  if (charts[key]) { try { charts[key].destroy() } catch(e) {} }
  const c = new Chart({ container, autoFit: true, height: 200 })
  c.coordinate({ transform: [{ type: 'transpose' }] })
  c.interval().data(data)
    .encode('x', 'name').encode('y', 'value')
  c.render()
  charts[key] = c
}

onMounted(() => {
  nextTick(() => {
    renderDonut('agentCallDonut', agentCallData)
    renderStackedBar('agentTokenTop5', agentTokenTop5Data)
    renderBarLine('agentCallTop5', agentCallTop5Data)
    renderHBar('agentAvgTop5', agentAvgTop5Data)
    renderHBar('agentTtftTop5', agentTtftTop5Data)
    renderHBar('agentTpotTop5', agentTpotTop5Data)
    renderDonut('modelTokenDonut', modelTokenData)
    renderStackedBar('modelTokenTop5', modelTokenTop5Data)
    renderBarLine('modelCallTop5', modelCallTop5Data)
    renderHBar('modelAvgTop5', modelAvgTop5Data)
    renderHBar('modelTtftTop5', modelTtftTop5Data)
    renderHBar('modelTpotTop5', modelTpotTop5Data)
    renderHBar('userTokenTop5', userTokenTop5Data)
    renderHBar('userSessionTop5', userSessionTop5Data)
    renderHBar('userModelTop5', userModelTop5Data)
  })
})

onBeforeUnmount(() => { destroyAll(); clearInterval(refreshTimer) })
</script>

<style>
.aad { padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

/* Toolbar */
.aad-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; margin-bottom: 0; flex-wrap: wrap; gap: 16px; }
.aad-toolbar-left { display: flex; align-items: center; gap: 8px; }
.aad-toolbar-right { display: flex; align-items: center; gap: 12px; }
.aad-time-pills { display: flex; gap: 4px; }
.aad-time-pill { padding: 4px 12px; border-radius: 4px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; font-size: 13px; color: #666; transition: all 0.15s; }
.aad-time-pill.active { background: var(--brand, #007DFF); color: #fff; border-color: var(--brand, #007DFF); }
.aad-refresh-btn { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 4px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; font-size: 13px; color: #666; }
.aad-refresh-btn:hover { border-color: var(--brand, #007DFF); color: var(--brand, #007DFF); }
.aad-last-refresh { font-size: 12px; color: #999; }

/* Hero */
.aad-hero { display: flex; gap: 16px; margin-bottom: 16px; }
.aad-hero-card { flex: 1; background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); text-align: center; }
.aad-hero-label { font-size: 12px; color: #999; margin-bottom: 8px; }
.aad-hero-value { font-size: 28px; font-weight: 700; color: #1a1a1a; }
.aad-hero-unit { font-size: 14px; font-weight: 400; color: #999; margin-left: 2px; }
.aad-hero-trend { margin-top: 6px; font-size: 12px; }
.aad-hero-trend.down { color: #52c41a; }
.aad-hero-trend.up { color: #f5222d; }
.aad-hero-trend-label { color: #999; margin-left: 4px; }

/* Agent Wrapper */
.aad-agent-wrapper { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 16px; }

/* Sections */
.aad-section { margin: 20px 0 12px; }
.aad-section-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }

/* Agent Grid */
.aad-agent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.aad-agent-card { background: #f7f8fa; border-radius: 8px; padding: 16px; cursor: pointer; transition: box-shadow 0.2s; }
.aad-agent-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.aad-agent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e8e8e8; }
.aad-agent-name { font-size: 14px; font-weight: 600; color: #007DFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aad-agent-arrow { color: #007DFF; font-size: 12px; flex-shrink: 0; }
.aad-agent-body { display: flex; flex-direction: column; gap: 6px; }
.aad-agent-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; }

/* Chart boxes */
.aad-charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.aad-chart-box { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.aad-chart-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
.aad-dropdown { font-size: 11px; color: #999; font-weight: 400; cursor: pointer; }
.aad-g2-chart { width: 100%; height: 200px; }
.aad-g2-hbar { height: 180px; }

/* Donut */
.aad-donut-wrap { position: relative; display: flex; justify-content: center; align-items: center; }
.aad-donut-center { position: absolute; top: 40px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1; pointer-events: none; }
.aad-donut-total { font-size: 24px; font-weight: 700; color: #1a1a1a; }
.aad-donut-sub { font-size: 11px; color: #999; }

@media (max-width: 1200px) { .aad-agent-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .aad-agent-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .aad-agent-grid { grid-template-columns: 1fr; } .aad-charts-row { grid-template-columns: 1fr; } .aad-hero { flex-wrap: wrap; } .aad-hero-card { min-width: calc(50% - 6px); } }
</style>
