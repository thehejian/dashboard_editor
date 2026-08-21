<template>
  <div class="overview-page">
    <div class="top-bar">
      <a-radio-group v-model:value="timeRange" size="small" button-style="solid" @change="renderTrendChart">
        <a-radio-button value="24h">近 24 小时</a-radio-button>
        <a-radio-button value="7d">近 7 天</a-radio-button>
        <a-radio-button value="30d">近 30 天</a-radio-button>
      </a-radio-group>
      <span class="update-time">更新于 10:32</span>
    </div>

    <div class="section">
      <div class="section-title"><i class="fa-solid fa-bell"></i> 今日要关注</div>
      <div class="focus-grid">
        <div class="focus-card focus-critical"><div class="focus-label">紧急事件待处理</div><div class="focus-desc">需立即处理</div><div class="focus-num">3</div><div class="focus-tags">GaussDB×1, ECS×2</div></div>
        <div class="focus-card focus-warning"><div class="focus-label">事件积压超2小时</div><div class="focus-desc">关注</div><div class="focus-num">12</div><div class="focus-tags">紧急×5, 重要×7</div></div>
        <div class="focus-card focus-danger"><div class="focus-label">事件量突增</div><div class="focus-desc">↑320%</div><div class="focus-num">GaussDB</div><div class="focus-tags">今日15个 vs 昨日3个</div></div>
        <div class="focus-card focus-muted"><div class="focus-label">高级别事件未配置转告警</div><div class="focus-desc">配置遗漏</div><div class="focus-num">critical事件</div><div class="focus-tags">无法及时通知</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><i class="fa-solid fa-heart-pulse"></i> 系统健康度</div>
      <div class="health-layout">
        <div class="health-gauge">
          <div class="gauge-ring"><svg viewBox="0 0 120 120" style="width:120px;height:120px"><circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="#fa8c16" stroke-width="10" stroke-dasharray="236 314" stroke-linecap="round" transform="rotate(-90 60 60)"/><g text-anchor="middle" transform="translate(60 60)">
            <text y="-4" font-size="18" font-weight="700" fill="#333">警告</text>
            <text y="16" font-size="11" fill="#999">健康度 75%</text>
          </g></svg></div>
          <div class="gauge-desc">基于近24h事件综合评估</div>
        </div>
        <div class="health-services">
          <div class="svc-row">
            <div class="svc-card svc-up"><span class="svc-name">GaussDB</span><span class="svc-count">15 个事件</span><span class="svc-trend trend-up">↑320%</span></div>
            <div class="svc-card svc-up"><span class="svc-name">ECS</span><span class="svc-count">8 个事件</span><span class="svc-trend trend-up">↑45%</span></div>
            <div class="svc-card svc-up"><span class="svc-name">MRS</span><span class="svc-count">5 个事件</span><span class="svc-trend trend-up">↑60%</span></div>
          </div>
          <div class="svc-row">
            <div class="svc-card svc-down"><span class="svc-name">RDS</span><span class="svc-count">3 个事件</span><span class="svc-trend trend-down">↓20%</span></div>
            <div class="svc-card svc-flat"><span class="svc-name">VPC</span><span class="svc-count">2 个事件</span><span class="svc-trend trend-flat">—</span></div>
            <div class="svc-card svc-down"><span class="svc-name">ELB</span><span class="svc-count">1 个事件</span><span class="svc-trend trend-down">↓10%</span></div>
          </div>
          <div class="svc-row">
            <div class="svc-card svc-flat"><span class="svc-name">IAM</span><span class="svc-count">1 个事件</span><span class="svc-trend trend-flat">—</span></div>
            <div class="svc-card svc-ok"><span class="svc-name">OBS</span><span class="svc-count">0 个事件</span><span class="svc-trend trend-flat">—</span></div>
            <div class="svc-card svc-ok"><span class="svc-name">AS</span><span class="svc-count">0 个事件</span><span class="svc-trend trend-flat">—</span></div>
          </div>
          <div class="svc-row">
            <div class="svc-card svc-flat"><span class="svc-name">DCS</span><span class="svc-count">1 个事件</span><span class="svc-trend trend-flat">—</span></div>
            <div class="svc-card svc-up"><span class="svc-name">DMS</span><span class="svc-count">3 个事件</span><span class="svc-trend trend-up">↑25%</span></div>
            <div class="svc-card svc-down"><span class="svc-name">APIG</span><span class="svc-count">1 个事件</span><span class="svc-trend trend-down">↓15%</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><i class="fa-solid fa-chart-line"></i> 异常趋势洞察</div>
      <div class="insight-subtitle">异常热度趋势（按级别加权：紧急×10 + 重要×5 + 次要×1）</div>
      <div ref="trendChartRef" class="trend-chart-box"></div>
      <div class="trend-legend">
        <span class="legend-dot dot-high">高危（>300）</span>
        <span class="legend-dot dot-warn">警告（150-300）</span>
        <span class="legend-dot dot-attn">关注（80-150）</span>
        <span class="legend-dot dot-ok">正常（<80）</span>
      </div>
      <div class="insight-grid">
        <div class="insight-card"><div class="insight-card-title">环比对比</div>
          <div class="insight-item"><span class="ii-label">近7天 本周 vs 上周</span><span class="ii-val trend-up">↑ 23%</span></div>
          <div class="insight-item"><span class="ii-label">今日 vs 昨日同时段</span><span class="ii-val trend-up">↑ 45%</span></div>
          <div class="insight-item"><span class="ii-label">本月 vs 上月同期</span><span class="ii-val trend-down">↓ 8%</span></div>
        </div>
        <div class="insight-card"><div class="insight-card-title">突增事件源</div>
          <div class="insight-item"><span class="ii-label">GaussDB</span><span class="ii-val trend-up">↑ 320% (今日15 vs 日均3)</span></div>
          <div class="insight-item"><span class="ii-label">ECS</span><span class="ii-val trend-up">↑ 45% (今日8 vs 日均5)</span></div>
          <div class="insight-item"><span class="ii-label">MRS</span><span class="ii-val trend-up">↑ 60% (今日5 vs 日均3)</span></div>
        </div>
        <div class="insight-card"><div class="insight-card-title">新出现异常</div>
          <div class="insight-item"><span class="ii-label">RDS连接池耗尽检测</span><span class="ii-badge new">NEW 今日首次</span></div>
          <div class="insight-item"><span class="ii-label">Kafka消费者延迟告警</span><span class="ii-badge new">NEW 昨日首次</span></div>
        </div>
        <div class="top-rules-card">
          <div class="insight-card-title">持续高频规则 (近7天)</div>
          <div class="rule-item"><span class="rule-name">慢查询检测</span><span class="rule-freq">日均 45 次</span></div>
          <div class="rule-item"><span class="rule-name">CPU使用率告警</span><span class="rule-freq">日均 32 次</span></div>
          <div class="rule-item"><span class="rule-name">ECS磁盘空间不足</span><span class="rule-freq">日均 28 次</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><i class="fa-solid fa-circle-nodes"></i> 四源事件分布</div>
      <div class="source-summary">总计: 1,286（近7天事件）</div>
      <div class="source-bars">
        <div class="source-row"><span class="source-label">运行日志</span><span class="source-bar-bg"><span class="source-bar-fill" style="width:74.3%"></span></span><span class="source-stat">956 (74.3%) <span class="trend-up">↑12%</span></span></div>
        <div class="source-row"><span class="source-label">操作日志</span><span class="source-bar-bg"><span class="source-bar-fill" style="width:14%"></span></span><span class="source-stat">180 (14.0%) <span class="trend-flat">—持平</span></span></div>
        <div class="source-row"><span class="source-label">告警</span><span class="source-bar-bg"><span class="source-bar-fill" style="width:6.9%"></span></span><span class="source-stat">89 (6.9%) <span class="trend-down">↓5%</span></span></div>
        <div class="source-row"><span class="source-label">巡检</span><span class="source-bar-bg"><span class="source-bar-fill" style="width:4.7%"></span></span><span class="source-stat">61 (4.7%) <span class="trend-flat">—持平</span></span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><i class="fa-solid fa-gauge-high"></i> 处理效能</div>
      <div class="efficiency-grid">
        <div class="eff-card"><div class="eff-label">处理及时率</div><div class="eff-value">78%</div><div class="eff-detail">平均处理时长 2.5h</div><div class="eff-detail warn">超时未处理 5 个</div></div>
        <div class="eff-card"><div class="eff-label">告警转化率</div><div class="eff-value">85%</div><div class="eff-detail">已转告警 1,093 个</div><div class="eff-detail warn">未配置规则 15%</div></div>
        <div class="eff-card"><div class="eff-label">规则有效性</div><div class="eff-value">92%</div><div class="eff-detail">有效规则 46 条</div><div class="eff-detail warn">待优化 3 条(忽略率>80%)</div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Chart } from '@antv/g2'

const timeRange = ref('7d')
const trendChartRef = ref(null)
let trendChart = null

function renderTrendChart() {
  if (trendChart) trendChart.destroy()
  const data = []
  const points = timeRange.value === '24h' ? 24 : timeRange.value === '7d' ? 7 : 30
  const start = new Date(2026, 6, 19)
  if (timeRange.value === '24h') {
    for (let i = 0; i < points; i++) {
      const date = `${String(i).padStart(2, '0')}:00`
      const base = 8 + Math.round(Math.random() * 18)
      data.push({ date, value: base })
    }
  } else {
    for (let i = 0; i < points; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const date = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const base = 85 + Math.round(Math.random() * 120)
      data.push({ date, value: base })
    }
  }
  trendChart = new Chart({ container: trendChartRef.value, autoFit: true, height: 200, padding: [20, 20, 30, 40] })
  trendChart.data(data)
  trendChart.interval().encode('x', 'date').encode('y', 'value').encode('color', (d) => d.value > 300 ? 'high' : d.value >= 150 ? 'warn' : d.value >= 80 ? 'attn' : 'ok').scale('color', { range: ['#ff4d4f', '#fa8c16', '#faad14', '#52c41a'] }).style('radius', 2)
  trendChart.axis('x', { label: { fontSize: 11 }, title: null })
  trendChart.axis('y', { label: { fontSize: 11 }, title: null, grid: true })
  trendChart.legend(false)
  trendChart.interaction('tooltip', { shared: true })
  trendChart.render()
}

onMounted(() => { setTimeout(() => renderTrendChart(), 100) })
onUnmounted(() => { if (trendChart) trendChart.destroy() })
</script>

<style scoped>
.overview-page { width: 100%; }
.top-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.update-time { font-size: 11px; color: #999; margin-left: auto; }
.section { background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
.section-title i { color: var(--brand, #1890ff); }

.focus-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.focus-card { border-radius: 8px; padding: 14px; border: 1px solid #e8e8e8; }
.focus-label { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
.focus-desc { font-size: 11px; margin-bottom: 8px; }
.focus-num { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.focus-tags { font-size: 11px; color: #666; }
.focus-critical { border-left: 3px solid #ff4d4f; }
.focus-critical .focus-label { color: #ff4d4f; }
.focus-critical .focus-desc { color: #ff4d4f; }
.focus-critical .focus-num { color: #ff4d4f; }
.focus-warning { border-left: 3px solid #fa8c16; }
.focus-warning .focus-label { color: #fa8c16; }
.focus-warning .focus-num { color: #fa8c16; }
.focus-danger { border-left: 3px solid #ff4d4f; background: #fff2f0; }
.focus-danger .focus-label { color: #cf1322; }
.focus-danger .focus-desc { color: #cf1322; }
.focus-danger .focus-num { color: #cf1322; font-size: 20px; }
.focus-muted { border-left: 3px solid #999; }
.focus-muted .focus-label { color: #666; }
.focus-muted .focus-num { color: #666; font-size: 14px; font-weight: 600; }

.health-layout { display: flex; gap: 20px; }
.health-gauge { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 20px; flex-shrink: 0; }
.gauge-desc { font-size: 11px; color: #999; text-align: center; }
.health-services { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.svc-row { display: flex; gap: 8px; }
.svc-card { flex: 1; display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 6px; background: #fafafa; border: 1px solid #f0f0f0; font-size: 12px; }
.svc-name { font-weight: 600; color: #333; min-width: 50px; }
.svc-count { color: #666; font-size: 11px; }
.svc-trend { font-size: 11px; font-weight: 500; margin-left: auto; }
.svc-up { border-left: 3px solid #ff4d4f; }
.svc-down { border-left: 3px solid #52c41a; }
.svc-flat { border-left: 3px solid #faad14; }
.svc-ok { border-left: 3px solid #d9d9d9; }

.insight-subtitle { font-size: 12px; color: #666; margin-bottom: 10px; }
.trend-chart-box { width: 100%; }
.trend-legend { display: flex; gap: 16px; margin: 8px 0 14px; font-size: 11px; color: #666; }
.legend-dot { display: flex; align-items: center; gap: 4px; }
.legend-dot::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-high::before { background: #ff4d4f; }
.dot-warn::before { background: #fa8c16; }
.dot-attn::before { background: #faad14; }
.dot-ok::before { background: #52c41a; }
.insight-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.insight-card { border: 1px solid #f0f0f0; border-radius: 6px; padding: 12px; }
.insight-card-title { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 8px; }
.insight-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px; }
.ii-label { color: #666; }
.ii-val { font-weight: 500; }
.ii-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; }
.ii-badge.new { background: #fff2f0; color: #ff4d4f; }
.top-rules-card { border: 1px solid #f0f0f0; border-radius: 6px; padding: 12px; }
.rule-item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #fafafa; }
.rule-item:last-child { border-bottom: none; }
.rule-name { color: #333; }
.rule-freq { color: #999; }

.source-summary { font-size: 12px; color: #666; margin-bottom: 10px; }
.source-bars { display: flex; flex-direction: column; gap: 10px; }
.source-row { display: flex; align-items: center; gap: 12px; }
.source-label { width: 60px; font-size: 12px; color: #333; flex-shrink: 0; }
.source-bar-bg { flex: 1; height: 20px; background: #f5f5f5; border-radius: 4px; overflow: hidden; }
.source-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #1890ff, #40a9ff); border-radius: 4px; }
.source-stat { width: 160px; font-size: 12px; color: #666; flex-shrink: 0; text-align: right; }

.efficiency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.eff-card { border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px; text-align: center; }
.eff-label { font-size: 13px; color: #666; margin-bottom: 6px; }
.eff-value { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 8px; }
.eff-detail { font-size: 12px; color: #999; }
.eff-detail.warn { color: #fa8c16; }

.trend-up { color: #ff4d4f; }
.trend-down { color: #52c41a; }
.trend-flat { color: #999; }

@media (max-width: 768px) {
  .top-bar { flex-wrap: wrap; gap: 8px; }
  .update-time { margin-left: 0; width: 100%; }
  .focus-grid { grid-template-columns: repeat(2, 1fr); }
  .health-layout { flex-direction: column; gap: 12px; }
  .health-gauge { padding: 8px 0; }
  .svc-row { flex-wrap: wrap; }
  .svc-card { flex: 1 1 calc(50% - 4px); }
  .trend-legend { flex-wrap: wrap; gap: 8px 12px; }
  .insight-grid { grid-template-columns: repeat(2, 1fr); }
  .source-row { flex-wrap: wrap; gap: 4px 8px; }
  .source-label { width: auto; }
  .source-stat { width: 100%; text-align: left; }
  .efficiency-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .section { padding: 12px; }
  .focus-grid { grid-template-columns: 1fr; }
  .svc-card { flex: 1 1 100%; }
  .insight-grid { grid-template-columns: 1fr; }
  .efficiency-grid { grid-template-columns: 1fr; }
  .ii-item { flex-wrap: wrap; }
}
</style>