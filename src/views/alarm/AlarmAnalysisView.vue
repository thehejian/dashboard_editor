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
        <svg class="aa-svg-chart" viewBox="0 0 350 160">
          <g v-for="(item, i) in alarmCategoryStats.slice(0, 7)" :key="item.category" :transform="topnTransform(i)">
            <text x="0" y="12" font-size="11" fill="#595959" dy="0.35em">{{ item.category }}</text>
            <rect x="72" y="2" :width="Math.max(item.pct / 100 * 200, 2)" height="16" :fill="catColor(item.category)" rx="2" />
            <text :x="72 + Math.max(item.pct / 100 * 200, 2) + 4" y="12" font-size="11" fill="#8C8C8C" dy="0.35em">{{ item.pct }}%</text>
          </g>
        </svg>
        <div class="aa-chart-hint">指导下一步基础设施优化方向</div>
      </div>
      <div class="aa-chart-card">
        <div class="aa-chart-title">降噪漏斗</div>
        <svg class="aa-svg-chart" viewBox="0 0 350 160">
          <g v-if="alarmFunnel.raw">
            <g v-for="(item, i) in funnelSteps" :key="item.step" :transform="funnelTransform(i)">
              <text x="0" y="14" font-size="11" fill="#595959" dy="0.35em">{{ item.step }}</text>
              <rect x="72" y="2" :width="Math.max(item.count / funnelMaxCount * 200, 2)" height="20" :fill="funnelColors[i]" rx="2" />
              <text :x="72 + Math.max(item.count / funnelMaxCount * 200, 2) + 4" y="14" font-size="11" fill="#595959" dy="0.35em">{{ item.count.toLocaleString() }}</text>
            </g>
          </g>
        </svg>
        <div class="aa-funnel-rate">降噪率: {{ alarmFunnel.rate }}%</div>
      </div>
      <div class="aa-chart-card aa-trend-card">
        <div class="aa-chart-title">处理趋势 · AI vs 人工（近30天）</div>
        <svg class="aa-svg-chart" viewBox="0 0 350 160">
          <g v-if="alarmTrendData.labels.length">
            <!-- Y axis labels -->
            <text v-for="(v, i) in [300,250,200,150,100]" :key="'y'+i" x="44" :y="10 + i * 30" font-size="10" fill="#8C8C8C" text-anchor="end" dy="0.35em">{{ v }}</text>
            <!-- Grid lines -->
            <line v-for="(v, i) in [300,250,200,150,100]" :key="'g'+i" x1="48" :y1="10 + i * 30" x2="335" :y2="10 + i * 30" stroke="#F0F0F0" stroke-width="1" />
            <!-- Polylines -->
            <polyline :points="trendAiPoints" fill="none" stroke="#722ED1" stroke-width="2" stroke-linejoin="round" />
            <polyline :points="trendManualPoints" fill="none" stroke="#BFBFBF" stroke-width="2" stroke-linejoin="round" />
            <!-- X axis labels -->
            <text v-for="(label, i) in alarmTrendData.labels" :key="'x'+i" :x="48 + i * 287 / 6" y="145" font-size="10" fill="#8C8C8C" text-anchor="middle" dy="0.35em">{{ label }}</text>
            <!-- Legend -->
            <circle cx="130" cy="153" r="3" fill="#722ED1" />
            <text x="138" y="153" font-size="10" fill="#595959" dy="0.35em">AI处理</text>
            <circle cx="200" cy="153" r="3" fill="#BFBFBF" />
            <text x="208" y="153" font-size="10" fill="#595959" dy="0.35em">人工处理</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Row 3: Incident List -->
    <div class="aa-table-card">
      <div class="aa-table-header">
        <span class="aa-table-title">告警分析列表 · 待处理</span>
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
        :pagination="{ pageSize: 5, showTotal: t => '共 ' + t + ' 条', size: 'small' }"
        row-key="incident_no"
        size="small"
        :scroll="{ x: 700, y: 360 }"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
function topnTransform(i) { return 'translate(0,' + (8 + i * 22) + ')' }
function funnelTransform(i) { return 'translate(0,' + (8 + i * 38) + ')' }

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
  } finally {
    alarmLoading.value = false
  }
}

const alarmTrendData = computed(() => alarmHeroStats.value.closedCount ? { labels: ['06-11','06-12','06-13','06-14','06-15','06-16','06-17'], aiClosed: [120,135,142,155,168,180,195], manualClosed: [300,290,275,260,240,230,220] } : { labels: [], aiClosed: [], manualClosed: [] })

const trendAiPoints = computed(() => {
  return alarmTrendData.value.aiClosed.map((v, i) => (48 + i * 287 / 6) + ',' + (135 - (v / 350) * 125)).join(' ')
})
const trendManualPoints = computed(() => {
  return alarmTrendData.value.manualClosed.map((v, i) => (48 + i * 287 / 6) + ',' + (135 - (v / 350) * 125)).join(' ')
})
const funnelSteps = computed(() => {
  const f = alarmFunnel.value
  if (!f.raw) return []
  return [
    { step: '原始告警', count: f.raw },
    { step: '频次去重', count: f.dedup },
    { step: '拓扑聚合', count: f.agg },
    { step: '有效事件', count: f.agg },
  ]
})
const funnelMaxCount = computed(() => funnelSteps.value[0]?.count || 1)
const funnelColors = ['#007DFF', '#597EF7', '#722ED1', '#07C160']

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
</script>

<style scoped>
.alarm-analysis-page { display: flex; flex-direction: column; gap: 16px; padding: 0; height: calc(100vh - 48px); overflow-y: auto; box-sizing: border-box; }
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
.aa-svg-chart { width: 100%; height: 160px; display: block; }
.aa-chart-hint { font-size: 11px; color: #8C8C8C; margin-top: 8px; }
.aa-funnel-rate { font-size: 12px; color: #595959; text-align: center; margin-top: 4px; }
.aa-root-cause-link { color: #007DFF; cursor: pointer; text-decoration: none; }
.aa-root-cause-link:hover { text-decoration: underline; color: #0056b3; }
.aa-table-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 14px; }
.aa-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.aa-table-title { font-size: 14px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 6px; }
.aa-table-actions { display: flex; align-items: center; gap: 8px; }
.aa-table-link { font-size: 12px; color: var(--brand, #007DFF); cursor: pointer; text-decoration: none; }
.aa-table-link:hover { text-decoration: underline; }
.aa-empty-text { font-size: 13px; color: #8C8C8C; text-align: center; padding: 24px; }
@media (max-width: 1200px) { .aa-hero-row { grid-template-columns: repeat(2, 1fr); } .aa-chart-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) {
  .aa-hero-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .aa-hero-card { padding: 12px; gap: 8px; }
  .aa-hero-icon { width: 36px; height: 36px; font-size: 16px; }
  .aa-hero-val { font-size: 20px; }
  .aa-hero-label { font-size: 12px; }
  .aa-hero-sub { font-size: 10px; }
  .aa-hero-trend { font-size: 10px; }
  .aa-chart-row { grid-template-columns: 1fr; gap: 8px; }
  .aa-chart-card { padding: 12px; }
  .aa-chart-title { font-size: 12px; }
  .aa-table-card { padding: 12px; }
  .aa-table-header { flex-direction: column; align-items: stretch; gap: 8px; }
  .aa-table-title { font-size: 13px; }
  .aa-table-actions { flex-wrap: wrap; gap: 6px; }
  .aa-table-actions .ant-input-search { width: 100% !important; }
}
@media (max-width: 480px) {
  .aa-hero-row { grid-template-columns: 1fr; }
  .aa-hero-card { padding: 10px; }
  .aa-hero-val { font-size: 18px; }
}
</style>
