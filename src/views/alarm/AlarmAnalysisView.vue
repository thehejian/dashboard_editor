<template>
  <div class="alarm-analysis-page">
    <!-- Row 1: Hero Metric -->
    <div class="aa-hero-row" v-loading="alarmLoading">
      <div class="aa-hero-card">
        <div class="aa-hero-icon" style="background:#F0F5FF;color:#007DFF"><i class="fa-solid fa-robot"></i></div>
        <div class="aa-hero-info">
          <div class="aa-hero-val">{{ alarmHeroStats.closedCount }}</div>
          <div class="aa-hero-label">AI自动闭环数</div>
          <div class="aa-hero-sub">次 / 近30天</div>
        </div>
        <div class="aa-hero-trend up">↑ 12% vs上月</div>
      </div>
      <div class="aa-hero-card">
        <div class="aa-hero-icon" style="background:#FFF7E6;color:#FF7D00"><i class="fa-solid fa-filter"></i></div>
        <div class="aa-hero-info">
          <div class="aa-hero-val">{{ alarmHeroStats.reductionRate }}%</div>
          <div class="aa-hero-label">告警降噪率</div>
          <div class="aa-hero-sub">{{ alarmFunnel.raw.toLocaleString() }} → {{ alarmFunnel.agg.toLocaleString() }}</div>
        </div>
        <div class="aa-hero-trend up">↑ 5.2% vs上月</div>
      </div>
      <div class="aa-hero-card">
        <div class="aa-hero-icon" style="background:#F6FFED;color:#07C160"><i class="fa-solid fa-bolt"></i></div>
        <div class="aa-hero-info">
          <div class="aa-hero-val">{{ alarmHeroStats.autoRate }}%</div>
          <div class="aa-hero-label">AI接管率</div>
          <div class="aa-hero-sub">占总告警比例</div>
        </div>
        <div class="aa-hero-trend up">↑ 5.2pp vs上月</div>
      </div>
      <div class="aa-hero-card">
        <div class="aa-hero-icon" style="background:#FFF1F0;color:#F5222D"><i class="fa-solid fa-clock"></i></div>
        <div class="aa-hero-info">
          <div class="aa-hero-val">{{ alarmHeroStats.savedHours }}</div>
          <div class="aa-hero-label">节省人工时</div>
          <div class="aa-hero-sub">小时 / 近30天</div>
        </div>
        <div class="aa-hero-trend up">↑ 38h vs上月</div>
      </div>
    </div>

    <!-- Row 2: Charts -->
    <div class="aa-chart-row">
      <div class="aa-chart-card">
        <div class="aa-chart-title">TopN 告警分类分布</div>
        <div ref="topnContainer" class="aa-chart-inner"></div>
        <div class="aa-chart-hint">指导下一步基础设施优化方向</div>
      </div>
      <div class="aa-chart-card">
        <div class="aa-chart-title">降噪漏斗</div>
        <div ref="funnelContainer" class="aa-chart-inner"></div>
        <div class="aa-funnel-rate">降噪率: {{ alarmFunnel.rate }}%</div>
      </div>
      <div class="aa-chart-card aa-trend-card">
        <div class="aa-chart-title">处理趋势 · AI vs 人工（近30天）</div>
        <div ref="alarmTrendContainer" class="aa-trend-chart"></div>
      </div>
    </div>

    <!-- Row 3: Incident List -->
    <div class="aa-table-card">
      <div class="aa-table-header">
        <span class="aa-table-title"><i class="fa-solid fa-bell"></i> 告警分析列表 · 待处理</span>
        <div class="aa-table-actions">
          <a-select v-model:value="alarmStatusFilter" size="small" style="width:120px" placeholder="状态筛选" allow-clear>
            <a-select-option value="investigating">进行中</a-select-option>
            <a-select-option value="resolved">已闭环</a-select-option>
          </a-select>
          <a-input-search v-model:value="alarmSearchText" size="small" placeholder="搜索事件、根因" style="width:220px" />
          <a-button size="small" @click="fetchAlarmData"><i class="fa-solid fa-rotate-right"></i></a-button>
        </div>
      </div>
      <a-table
        :columns="alarmIncidentColumns"
        :data-source="filteredAlarmIncidents"
        :pagination="{ pageSize: 5, showTotal: t => '共 ' + t + ' 条' }"
        row-key="incident_no"
        size="small"
        :scroll="{ y: 360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <span class="aa-root-cause-link" @click="goToFaultDetail(record)">{{ record.title }}</span>
          </template>
          <template v-if="column.key === 'level'">
            <a-tag :color="record.level === 'critical' ? 'red' : 'orange'">{{ { critical: 'P1紧急', warning: 'P2重要', info: 'P3提示' }[record.level] || record.level }}</a-tag>
          </template>
          <template v-if="column.key === 'category'">
            <a-tag>{{ record.category }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="{ investigating: 'processing', resolved: 'green', suppressed: 'default' }[record.status] || 'default'">
              {{ { investigating: '进行中', resolved: '已闭环', suppressed: '已屏蔽' }[record.status] || record.status }}
            </a-tag>
          </template>
          <template v-if="column.key === 'handler'">
            <span v-if="record.handler === 'ai'" style="color:#722ED1"><i class="fa-solid fa-robot"></i> AI自动</span>
            <span v-else>{{ record.handler || '—' }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-btns">
              <a-tooltip :title="record.category === '容量类' ? '一键自愈' : 'AI分析'">
                <button class="icon-btn" :class="{ 'ai-btn': record.category !== '容量类' }" @click.stop="openAlarmAnalysis(record)">
                  <i :class="record.category === '容量类' ? 'fa-solid fa-bolt' : 'fa-solid fa-robot'"></i>
                </button>
              </a-tooltip>
              <a-tooltip title="查看详情"><button class="icon-btn" @click.stop="router.push('/alarm-analysis/' + record.incident_no)"><i class="fa-solid fa-eye"></i></button></a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Row 4: Apps to watch -->
    <div class="aa-table-card">
      <AiopsAppCards :apps="alarmApps" :counts="alarmAppCounts" @app-click="onAppClick" />
    </div>

    <!-- Row 5: Healing Records -->
    <div class="aa-table-card">
      <AiopsHealingRecords :records="alarmHealingRecords" @record-click="onHealingRecordClick" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Chart } from '@antv/g2'
import AiopsAppCards from '../../components/aiops/AiopsAppCards.vue'
import AiopsHealingRecords from '../../components/aiops/AiopsHealingRecords.vue'

const router = useRouter()
const alarmLoading = ref(false)
const alarmHeroStats = ref({ closedCount: 0, reductionRate: 0, autoRate: 0, savedHours: 0 })
const alarmFunnel = ref({ raw: 0, dedup: 0, agg: 0, rate: 0 })
const alarmCategoryStats = ref([])
const alarmIncidents = ref([])
const alarmStatusFilter = ref(null)
const alarmSearchText = ref('')
const alarmApps = ref([])
const alarmAppCounts = ref({ critical: 0, warning: 0 })
const alarmHealingRecords = ref([])
const alarmTrendContainer = ref(null)
const topnContainer = ref(null)
const funnelContainer = ref(null)
let alarmTrendChart = null
let topnChart = null
let funnelChart = null

const alarmIncidentColumns = [
  { title: '事件ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true },
  { title: '根因摘要', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '关联', dataIndex: 'affected_count', key: 'affected_count', width: 50 },
  { title: '级别', key: 'level', width: 80 },
  { title: '分类', key: 'category', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '处理人', key: 'handler', width: 90 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

function catColor(cat) {
  const map = { '容量类': '#007DFF', '阈值类': '#FA8C16', '证书类': '#722ED1', '网络类': '#13C2C2', '服务类': '#F5222D', '硬件类': '#EB2F96', '合规类': '#8C8C8C' }
  return map[cat] || '#BFBFBF'
}

async function fetchAlarmData() {
  alarmLoading.value = true
  try {
    const [statsRes, incRes] = await Promise.all([
      fetch('/api/alarm/overview-stats').then(r => r.json()),
      fetch('/api/alarm/incidents').then(r => r.json()),
    ])
    if (statsRes.success) {
      alarmHeroStats.value = statsRes.data.heroStats
      alarmCategoryStats.value = statsRes.data.categoryStats
      alarmFunnel.value = statsRes.data.funnelData
      alarmHealingRecords.value = statsRes.data.healingRecords || []
    }
    if (incRes.success) {
      alarmIncidents.value = incRes.data
      const appMap = {}
      for (const inc of incRes.data) {
        for (const a of (inc.related_alerts || [])) {
          const res = a.resource || ''
          const name = res.replace(/\s*\(.*\)/, '').trim()
          if (!appMap[name]) appMap[name] = { name, type: a.category || '其他', status: a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'normal', score: a.level === 'critical' ? '异常' : '正常', alertCount: 0, incidentNo: inc.incident_no }
          appMap[name].alertCount++
          if (a.level === 'critical') appMap[name].status = 'critical'
          else if (a.level === 'warning' && appMap[name].status !== 'critical') appMap[name].status = 'warning'
        }
      }
      alarmApps.value = Object.values(appMap).sort((a, b) => ({ critical: 0, warning: 1, normal: 2 }[a.status] - { critical: 0, warning: 1, normal: 2 }[b.status]))
      alarmAppCounts.value = {
        critical: alarmApps.value.filter(a => a.status === 'critical').length,
        warning: alarmApps.value.filter(a => a.status === 'warning').length,
      }
    }
    nextTick(() => {
      renderTopNChart()
      renderFunnelChart()
      renderAlarmTrendChart()
    })
  } finally {
    alarmLoading.value = false
  }
}

const alarmTrendData = computed(() => alarmHeroStats.value.closedCount ? { labels: ['06-11','06-12','06-13','06-14','06-15','06-16','06-17'], aiClosed: [120,135,142,155,168,180,195], manualClosed: [300,290,275,260,240,230,220] } : { labels: [], aiClosed: [], manualClosed: [] })

function renderAlarmTrendChart() {
  if (alarmTrendChart) { alarmTrendChart.destroy(); alarmTrendChart = null }
  if (!alarmTrendContainer.value) return
  const labels = alarmTrendData.value.labels || []
  const ai = alarmTrendData.value.aiClosed || []
  const manual = alarmTrendData.value.manualClosed || []
  const data = []
  for (let i = 0; i < labels.length; i++) {
    data.push({ time: labels[i], type: 'AI处理', value: ai[i] || 0 })
    data.push({ time: labels[i], type: '人工处理', value: manual[i] || 0 })
  }
  alarmTrendChart = new Chart({ container: alarmTrendContainer.value, autoFit: true, height: 140, padding: [10, 12, 24, 44] })
  alarmTrendChart.data(data)
  alarmTrendChart.line().encode('x', 'time').encode('y', 'value').encode('color', 'type').encode('shape', 'smooth').scale('color', { range: ['#722ED1', '#BFBFBF'] }).style('lineWidth', 2).tooltip({ title: 'time', items: [{ channel: 'y', name: 'value' }] })
  alarmTrendChart.axis('x', { title: null, labelFontSize: 10, labelAutoHide: 'eqX' })
  alarmTrendChart.axis('y', { title: null, labelFontSize: 10 })
  alarmTrendChart.legend('color', { position: 'bottom', itemSpacing: 16, itemLabelFontSize: 11 })
  alarmTrendChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  alarmTrendChart.render()
}

function renderTopNChart() {
  if (topnChart) { topnChart.destroy(); topnChart = null }
  if (!topnContainer.value) return
  const data = alarmCategoryStats.value.slice(0, 7)
  if (!data.length) return
  topnChart = new Chart({ container: topnContainer.value, autoFit: true, height: 180, padding: [4, 48, 4, 56] })
  topnChart.data(data)
  topnChart.coordinate({ transform: [{ type: 'transpose' }] })
  topnChart.interval()
    .encode('x', 'category')
    .encode('y', 'pct')
    .encode('color', 'category')
    .scale('color', { range: ['#007DFF', '#FA8C16', '#13C2C2', '#722ED1', '#F5222D', '#EB2F96', '#8C8C8C'] })
    .style('maxWidth', 14)
    .style('radius', [2, 2, 0, 0])
    .axis('x', { title: null, labelFontSize: 10, line: null, tick: null })
    .axis('y', { title: null, labelFontSize: 10, line: null, tick: null })
    .label({ text: 'pct', formatter: v => v + '%', position: 'right', fontSize: 10, fill: '#8C8C8C' })
    .tooltip({ title: 'category', items: [{ field: 'pct', name: '占比', formatter: v => v + '%' }] })
  topnChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  topnChart.render()
}

function renderFunnelChart() {
  if (funnelChart) { funnelChart.destroy(); funnelChart = null }
  if (!funnelContainer.value) return
  const f = alarmFunnel.value
  if (!f.raw) return
  const data = [
    { step: '原始告警', count: f.raw },
    { step: '频次去重', count: f.dedup },
    { step: '拓扑聚合', count: f.agg },
    { step: '有效事件', count: f.agg },
  ]
  funnelChart = new Chart({ container: funnelContainer.value, autoFit: true, height: 160, padding: [4, 48, 4, 8] })
  funnelChart.coordinate({ transform: [{ type: 'transpose' }] })
  funnelChart.data(data)
  funnelChart.interval()
    .encode('x', 'step')
    .encode('y', 'count')
    .encode('color', 'step')
    .scale('color', { range: ['#007DFF', '#597EF7', '#722ED1', '#07C160'] })
    .style('maxWidth', 20)
    .style('radius', [2, 2, 0, 0])
    .axis('x', { title: null, labelFontSize: 10, line: null, tick: null })
    .axis('y', { title: null, label: false, line: null, tick: null })
    .label({ text: 'count', formatter: v => v.toLocaleString(), position: 'right', fontSize: 10, fill: '#595959' })
    .tooltip({ title: 'step', items: [{ field: 'count', name: '数量', formatter: v => v.toLocaleString() }] })
  funnelChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  funnelChart.render()
}

const filteredAlarmIncidents = computed(function() {
  let list = alarmIncidents.value
  if (alarmStatusFilter.value) list = list.filter(a => a.status === alarmStatusFilter.value)
  if (alarmSearchText.value) {
    const kw = alarmSearchText.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
  }
  return list
})

function goToFaultDetail(record) {
  router.push('/ops/incident/' + (record.incident_no || record.id))
}

function onAppClick(app) {
  if (app.incidentNo) router.push('/ops/incident/' + app.incidentNo)
}

function onHealingRecordClick(record) {
  if (record.nodeId) router.push('/ops/incident/' + record.nodeId)
}

function openAlarmAnalysis(record) {
  if (record.category === '容量类') {
    // Mock auto-heal
    const idx = alarmIncidents.value.indexOf(record)
    if (idx >= 0) {
      alarmIncidents.value[idx].status = 'resolved'
      alarmIncidents.value = [...alarmIncidents.value]
    }
  } else {
    router.push('/alarm-analysis/' + record.incident_no)
  }
}

onMounted(() => { fetchAlarmData() })
onBeforeUnmount(() => {
  if (topnChart) topnChart.destroy()
  if (funnelChart) funnelChart.destroy()
  if (alarmTrendChart) alarmTrendChart.destroy()
})
watch(alarmTrendData, () => { nextTick(() => renderAlarmTrendChart()) }, { deep: true })
watch(alarmCategoryStats, () => { nextTick(() => renderTopNChart()) }, { deep: true })
watch(alarmFunnel, () => { nextTick(() => renderFunnelChart()) }, { deep: true })
</script>

<style scoped>
.alarm-analysis-page { display: flex; flex-direction: column; gap: 16px; padding: 16px 24px 24px; height: calc(100vh - 48px); overflow-y: auto; box-sizing: border-box; }
.aa-hero-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; flex-shrink: 0; }
.aa-hero-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.aa-hero-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.aa-hero-info { flex: 1; min-width: 0; }
.aa-hero-val { font-size: 24px; font-weight: 700; color: #1A1A1A; line-height: 1.2; }
.aa-hero-label { font-size: 13px; color: #595959; margin-top: 2px; }
.aa-hero-sub { font-size: 11px; color: #8C8C8C; margin-top: 1px; }
.aa-hero-trend { font-size: 11px; margin-top: 0; text-align: right; white-space: nowrap; }
.aa-hero-trend.up { color: #52C41A; }
.aa-chart-row { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 12px; flex-shrink: 0; }
.aa-chart-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 14px; }
.aa-chart-title { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 12px; }
.aa-chart-inner { height: 160px; }
.aa-chart-hint { font-size: 11px; color: #8C8C8C; margin-top: 8px; }
.aa-funnel-rate { font-size: 12px; color: #595959; text-align: center; margin-top: 4px; }
.aa-trend-chart { height: 120px; }
.aa-root-cause-link { color: #007DFF; cursor: pointer; text-decoration: none; }
.aa-root-cause-link:hover { text-decoration: underline; color: #0056b3; }
.aa-table-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 14px; }
.aa-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.aa-table-title { font-size: 14px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 6px; }
.aa-table-actions { display: flex; align-items: center; gap: 8px; }
.aa-table-link { font-size: 12px; color: var(--brand, #007DFF); cursor: pointer; text-decoration: none; }
.aa-table-link:hover { text-decoration: underline; }
.aa-empty-text { font-size: 13px; color: #8C8C8C; text-align: center; padding: 24px; }
@media (max-width: 1200px) { .aa-hero-row { grid-template-columns: repeat(2, 1fr); } .aa-chart-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .aa-hero-row { grid-template-columns: 1fr; } .aa-chart-row { grid-template-columns: 1fr; } }
</style>
