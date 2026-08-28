<template>
  <div class="alarm-analysis-page">
    <!-- Row 1: Hero Metric -->
    <div class="aa-hero-row" v-loading="alarmLoading">
      <div class="aa-hero-card">
        <div class="aa-hero-icon" style="background:#F0F5FF;color:#007DFF"><i class="fa-solid fa-robot"></i></div>
        <div class="aa-hero-info">
          <div class="aa-hero-val">{{ alarmHeroStats.closedCount }}</div>
          <div class="aa-hero-label">AI自动分析</div>
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
    </div>

    <!-- Row 2: Charts -->
    <div class="aa-chart-row">
      <div class="aa-chart-card">
        <div class="aa-chart-title">告警类别分布</div>
        <div ref="topnContainer" class="aa-chart-container"></div>
      </div>
      <div class="aa-chart-card">
        <div class="aa-chart-title">告警降噪过滤统计</div>
        <div class="aa-filter-stats">
          <div class="aa-funnel-bar">
            <div class="aa-funnel-stage">
              <span class="aa-funnel-num">{{ alarmFunnel.raw.toLocaleString() }}</span>
              <span class="aa-funnel-label">原始告警</span>
            </div>
            <span class="aa-funnel-arrow">→</span>
            <div class="aa-funnel-stage">
              <span class="aa-funnel-num aa-funnel-filtered">{{ (alarmFunnel.raw - alarmFunnel.agg).toLocaleString() }}</span>
              <span class="aa-funnel-label">已过滤</span>
            </div>
            <span class="aa-funnel-arrow">→</span>
            <div class="aa-funnel-stage">
              <span class="aa-funnel-num aa-funnel-rate">{{ alarmFunnel.rate }}% ↓</span>
              <span class="aa-funnel-label">降噪率</span>
            </div>
          </div>
          <div class="aa-filter-cards">
            <div class="aa-filter-card-item">
              <div class="aa-filter-card-title critical">紧急</div>
              <a-statistic :value="alarmFunnel.filteredCritical || 0" :value-style="{ fontSize: '20px', fontWeight: 700, color: '#ff4d4f' }" />
              <a-progress :percent="filterPctNum(alarmFunnel.filteredCritical)" :stroke-color="'#ff4d4f'" :show-info="false" size="small" />
            </div>
            <div class="aa-filter-card-item">
              <div class="aa-filter-card-title warning">重要</div>
              <a-statistic :value="alarmFunnel.filteredWarning || 0" :value-style="{ fontSize: '20px', fontWeight: 700, color: '#fa8c16' }" />
              <a-progress :percent="filterPctNum(alarmFunnel.filteredWarning)" :stroke-color="'#fa8c16'" :show-info="false" size="small" />
            </div>
            <div class="aa-filter-card-item">
              <div class="aa-filter-card-title info">次要</div>
              <a-statistic :value="alarmFunnel.filteredInfo || 0" :value-style="{ fontSize: '20px', fontWeight: 700, color: '#1890ff' }" />
              <a-progress :percent="filterPctNum(alarmFunnel.filteredInfo)" :stroke-color="'#1890ff'" :show-info="false" size="small" />
            </div>
          </div>
        </div>
      </div>
      <div class="aa-chart-card">
        <div class="aa-chart-title">告警AI处理趋势</div>
        <div ref="alarmTrendContainer" class="aa-chart-container"></div>
      </div>
    </div>

    <!-- Row 3: Incident List -->
    <div class="aa-table-card">
      <div class="aa-table-header">
        <span class="aa-table-title">告警分析列表 · 待处理</span>
        <div class="aa-table-actions">
          <a-button-group size="small">
            <a-button :type="alarmViewMode === 'list' ? 'primary' : 'default'" @click="alarmViewMode = 'list'">列表</a-button>
            <a-button :type="alarmViewMode === 'category' ? 'primary' : 'default'" @click="alarmViewMode = 'category'">分类视图</a-button>
          </a-button-group>
          <a-select v-model:value="alarmStatusFilter" size="small" style="width:120px" placeholder="状态筛选" allow-clear>
            <a-select-option value="investigating">进行中</a-select-option>
            <a-select-option value="resolved">已闭环</a-select-option>
          </a-select>
          <a-input-search v-model:value="alarmSearchText" size="small" placeholder="搜索故障名称、ID" style="width:220px" />
          <a-button size="small" @click="fetchAlarmData"><i class="fa-solid fa-rotate-right"></i></a-button>
        </div>
      </div>
      <!-- Category Stats Bar -->
      <div class="aa-category-stats" v-if="alarmIncidentCategoryStats.length">
        <span
          v-for="cs in alarmIncidentCategoryStats"
          :key="cs.category"
          class="aa-cat-tag"
          :class="{ active: alarmCategoryFilter === cs.category }"
          @click="alarmCategoryFilter = alarmCategoryFilter === cs.category ? '' : cs.category"
        >
          <span class="aa-cat-dot" :style="{ background: cs.heal_color === 'green' ? '#52c41a' : '#faad14' }"></span>
          {{ cs.category }} {{ cs.count }}
        </span>
        <span class="aa-cat-summary">可自动修复 {{ autoHealCount }} 类 · 需人工配合 {{ manualHealCount }} 类</span>
      </div>
      <!-- List View -->
      <a-table
        v-if="alarmViewMode === 'list'"
        :columns="alarmIncidentColumns"
        :data-source="filteredAlarmIncidents"
        :pagination="{ pageSize: 15, showTotal: t => '共 ' + t + ' 条', size: 'small' }"
        row-key="incident_no"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <span class="aa-root-cause-link" @click="goToFaultDetail(record)">{{ record.title }}</span>
          </template>
          <template v-if="column.key === 'affected_count'">
            <span class="aa-related-link" @click="openRelatedDrawer(record)">{{ record.affected_count }}</span>
          </template>
          <template v-if="column.key === 'level'">
            <a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">{{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}</a-tag>
          </template>
          <template v-if="column.key === 'category'">
            <a-tag :color="record.heal_color === 'green' ? 'green' : 'orange'" style="cursor:pointer">
              {{ record.category_label || record.category }}
            </a-tag>
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
          <template v-if="column.key === 'noise_reduction'">
            <div class="noise-reduction-cell" @click.stop="openRelatedDrawer(record)" style="cursor:pointer">
              <div class="noise-reduction-bar">
                <div class="noise-reduction-fill" :class="record.noise_reduction >= 80 ? 'high' : record.noise_reduction >= 50 ? 'medium' : 'low'" :style="{ width: record.noise_reduction + '%' }"></div>
              </div>
              <span class="noise-reduction-value" style="color:#1890ff;text-decoration:underline">{{ record.noise_reduction }}%</span>
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-text-links">
              <template v-if="record.category === '容量类'">
                <a class="aa-table-link" @click.stop="openAlarmAnalysis(record)"><i class="fa-solid fa-bolt"></i> 故障自愈</a>
              </template>
              <template v-else>
                <a class="aa-table-link" @click.stop="openAlarmAnalysis(record)"><i class="fa-solid fa-robot"></i> AI分析</a>
              </template>
              <a class="aa-table-link" @click.stop="router.push('/ops/incident/' + record.incident_no)"><i class="fa-solid fa-eye"></i> 查看详情</a>
            </div>
          </template>
        </template>
      </a-table>
      <!-- Category View -->
      <div v-if="alarmViewMode === 'category'" class="aa-category-view">
        <div v-for="cs in alarmIncidentCategoryStats" :key="cs.category" class="aa-cat-group">
          <div class="aa-cat-group-header">
            <span class="aa-cat-dot" :style="{ background: cs.heal_color === 'green' ? '#52c41a' : '#faad14' }"></span>
            <span class="aa-cat-group-title">{{ cs.category }} ({{ cs.count }}条)</span>
            <a-tag :color="cs.heal_color === 'green' ? 'green' : 'orange'" size="small">{{ cs.heal === 'auto' ? '可自动修复' : '需人工配合' }}</a-tag>
            <span class="aa-cat-group-desc">{{ cs.desc }}</span>
          </div>
          <div class="aa-cat-group-list">
            <div v-for="inc in filteredAlarmIncidents.filter(i => i.category === cs.category)" :key="inc.incident_no" class="aa-cat-item">
              <span class="aa-cat-item-title" @click="goToFaultDetail(inc)">{{ inc.title }}</span>
              <span class="aa-cat-item-id">{{ inc.incident_no }}</span>
              <a-tag :color="{ investigating: 'processing', resolved: 'green', suppressed: 'default' }[inc.status]" size="small">
                {{ { investigating: '进行中', resolved: '已闭环', suppressed: '已屏蔽' }[inc.status] || inc.status }}
              </a-tag>
            </div>
            <div v-if="filteredAlarmIncidents.filter(i => i.category === cs.category).length === 0" class="aa-cat-empty">该分类暂无告警</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unified Drawer: 告警详情 -->
    <a-drawer
      :open="relatedDrawerVisible"
      title="告警详情"
      :width="drawerWidth"
      placement="right"
      @close="relatedDrawerVisible = false"
    >
      <template v-if="relatedDrawerRecord">
        <div class="related-drawer-incident">{{ relatedDrawerRecord.incident_no }} · {{ relatedDrawerRecord.title }}</div>

        <!-- 降噪概览（紧凑一行式） -->
        <div class="rd-overview">
          <div class="rd-overview-main">
            <span class="rd-overview-label">降噪</span>
            <span class="rd-overview-flow-text">{{ relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count }} → {{ relatedDrawerRecord.affected_count }}</span>
            <span class="rd-overview-sep">|</span>
            <span class="rd-overview-label">降噪率</span>
            <span class="rd-overview-rate" :style="{ color: (relatedDrawerRecord.noise_reduction || 0) >= 80 ? '#52c41a' : (relatedDrawerRecord.noise_reduction || 0) >= 50 ? '#1890ff' : '#faad14' }">{{ relatedDrawerRecord.noise_reduction || 0 }}%</span>
          </div>
          <div class="rd-overview-rules">
            <span class="rd-overview-rules-label">规则</span>
            <a-tag class="rd-overview-rule" style="cursor:pointer" @click="$router.push('/alarm/settings/rules?tab=aggregation')">同metric聚合(5min)</a-tag>
            <a-tag class="rd-overview-rule" style="cursor:pointer" @click="$router.push('/alarm/settings/rules?tab=aggregation')">重复触发过滤</a-tag>
            <a style="font-size:12px;margin-left:4px" @click="$router.push('/alarm/settings/rules?tab=aggregation')">查看更多规则配置 →</a>
          </div>
        </div>

        <!-- 关联告警表格 -->
        <div class="rd-section-title"><i class="fa-solid fa-list-check"></i> 关联告警 ({{ relatedDrawerRecord.affected_count }}条)</div>
        <a-table
          :columns="relatedAlertColumns"
          :data-source="relatedDrawerRecord.related_alerts || []"
          :pagination="false"
          row-key="id"
          size="small"
          :scroll="{ x: 490, y: 300 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'" size="small">
                {{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}
              </a-tag>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'firing' ? 'red' : record.status === 'resolved' ? 'green' : 'default'" size="small">
                {{ record.status === 'firing' ? '待处理' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'ops'">
              <a class="aa-table-link" @click="router.push('/ops/incident/' + (record.incident_id || relatedDrawerRecord.incident_no))">AI分析</a>
              <a class="aa-table-link" @click="router.push('/alarm/current?alertId=' + record.id)" style="margin-left:6px">详情</a>
            </template>
          </template>
        </a-table>

        <!-- 已过滤告警折叠区 -->
        <div class="rd-filtered-section" v-if="(relatedDrawerRecord.raw_count || 0) > relatedDrawerRecord.affected_count">
          <div class="rd-filtered-toggle" @click="filteredAlertVisible = !filteredAlertVisible">
            <i class="fa-solid" :class="filteredAlertVisible ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
            已过滤告警 ({{ (relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count) - relatedDrawerRecord.affected_count }}条)
          </div>
          <div v-if="filteredAlertVisible" class="rd-filtered-list">
            <div v-for="(alert, idx) in generateFilteredAlerts(relatedDrawerRecord)" :key="idx" class="rd-filtered-item">
              <a-tag :color="alert.level === 'critical' ? 'red' : alert.level === 'warning' ? 'orange' : 'blue'" size="small">
                {{ { critical: '紧急', warning: '重要', info: '次要' }[alert.level] || alert.level }}
              </a-tag>
              <span class="rd-filtered-title">{{ alert.title }}</span>
              <span class="rd-filtered-reason">{{ alert.reason }}</span>
            </div>
          </div>
        </div>

        <div class="related-drawer-footer">
          <a-button type="primary" size="small" @click="router.push('/ops/incident/' + relatedDrawerRecord.incident_no); relatedDrawerVisible = false">查看告警根因</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Chart } from '@antv/g2'

const router = useRouter()
const alarmLoading = ref(false)
const alarmHeroStats = ref({ closedCount: 0, reductionRate: 0, autoRate: 0 })
const alarmFunnel = ref({ raw: 0, dedup: 0, agg: 0, rate: 0, filteredCritical: 0, filteredWarning: 0, filteredInfo: 0 })

function filterPctNum(val) {
  const total = (alarmFunnel.value.filteredCritical || 0) + (alarmFunnel.value.filteredWarning || 0) + (alarmFunnel.value.filteredInfo || 0)
  if (!total) return 0
  return Math.round((val || 0) / total * 100)
}
const alarmCategoryStats = ref([])
const alarmIncidents = ref([])
const alarmStatusFilter = ref(null)
const alarmSearchText = ref('')
const alarmViewMode = ref('list')
const alarmCategoryFilter = ref('')
const alarmIncidentCategoryStats = ref([])
const topnContainer = ref(null)
const funnelContainer = ref(null)
const alarmTrendContainer = ref(null)
let topnChart = null
let funnelChart = null
let alarmTrendChart = null
const relatedDrawerVisible = ref(false)
const relatedDrawerRecord = ref(null)
const filteredAlertVisible = ref(false)
const drawerWidth = ref(Math.min(window.innerWidth * 0.9, 1200))
function onDrawerResize() { drawerWidth.value = Math.min(window.innerWidth * 0.9, 1200) }

function generateFilteredAlerts(record) {
  const raw = record.raw_count || record.affected_count
  const kept = record.affected_count
  const filteredCount = raw - kept
  if (filteredCount <= 0) return []
  const reasons = ['同metric去重', '1h内未达聚合阈值', '已屏蔽告警', '重复触发过滤']
  const alerts = []
  const relatedTitles = (record.related_alerts || []).map(a => a.title)
  for (let i = 0; i < Math.min(filteredCount, 6); i++) {
    alerts.push({
      level: i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'warning' : 'info',
      title: relatedTitles[i % relatedTitles.length] || '告警 #' + (kept + i + 1),
      reason: reasons[i % reasons.length],
    })
  }
  return alerts
}

const relatedAlertColumns = [
  { title: '级别', key: 'level', width: 50 },
  { title: '告警名称', dataIndex: 'title', key: 'title', width: 150, ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', width: 80, ellipsis: true },
  { title: '状态', key: 'status', width: 50 },
  { title: '触发时间', dataIndex: 'trigger_time', key: 'trigger_time', width: 90 },
  { title: '操作', key: 'ops', width: 70, fixed: 'right' },
]

const alarmIncidentColumns = [
  { title: '故障名称', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
  { title: '故障ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true },
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
  { title: '级别', key: 'level', width: 80 },
  { title: '分类策略', key: 'category', width: 120, filters: [{ text: '容量类', value: '容量类' }, { text: '阈值类', value: '阈值类' }, { text: '网络类', value: '网络类' }, { text: '证书类', value: '证书类' }, { text: '服务类', value: '服务类' }, { text: '硬件类', value: '硬件类' }, { text: '配置类', value: '配置类' }], onFilter: (val, rec) => rec.category === val },
  { title: '状态', key: 'status', width: 80, filters: [{ text: '进行中', value: 'investigating' }, { text: '已闭环', value: 'resolved' }, { text: '已屏蔽', value: 'suppressed' }], onFilter: (val, rec) => rec.status === val },
  { title: '处理人', key: 'handler', width: 90, filters: [{ text: 'AI自动', value: 'ai' }, { text: '手动', value: 'manual' }], onFilter: (val, rec) => val === 'ai' ? rec.handler === 'ai' : rec.handler && rec.handler !== 'ai' },
  { title: '告警降噪率', key: 'noise_reduction', width: 120 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

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
    }
    if (incRes.success) {
      alarmIncidents.value = incRes.data
      alarmIncidentCategoryStats.value = incRes.categoryStats || []
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

function renderTopNChart() {
  if (topnChart) { topnChart.destroy(); topnChart = null }
  if (!topnContainer.value) return
  const data = alarmCategoryStats.value.slice(0, 7)
  if (!data.length) return
  topnChart = new Chart({ container: topnContainer.value, autoFit: true })
  topnChart.data(data)
  topnChart.coordinate({ transform: [{ type: 'transpose' }] })
  topnChart.interval().encode('x', 'category').encode('y', 'pct').encode('size', 16)
  topnChart.axis('x', { title: false }).axis('y', { title: false })
  topnChart.render()
}

function renderFunnelChart() {
  if (!funnelContainer.value) return
  const f = alarmFunnel.value
  if (!f.raw) return
  const data = [
    { step: '原始告警', count: 100 },
    { step: '时间频次聚合', count: Math.round(f.dedup / f.raw * 100) },
    { step: '拓扑血缘聚合', count: Math.round(f.agg / f.raw * 100) },
    { step: 'AI语义关联', count: Math.round(f.rate / f.raw * 100) },
  ]
  funnelChart = new Chart({ container: funnelContainer.value, autoFit: true })
  funnelChart.data(data)
  funnelChart.coordinate({ transform: [{ type: 'transpose' }] })
  funnelChart.interval().encode('x', 'step').encode('y', 'count').encode('size', 16)
  funnelChart.axis('x', { title: false, label: { autoRotate: false } }).axis('y', { title: false, tickCount: 3, label: { autoRotate: false, formatter: d => d + '%' } })
  funnelChart.render()
}

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
  alarmTrendChart = new Chart({ container: alarmTrendContainer.value, autoFit: true })
  alarmTrendChart.data(data)
  alarmTrendChart.line().encode('x', 'time').encode('y', 'value').encode('color', 'type')
  alarmTrendChart.axis('x', { title: false }).axis('y', { title: false })
  alarmTrendChart.render()
}

const filteredAlarmIncidents = computed(function() {
  let list = alarmIncidents.value
  if (alarmStatusFilter.value) list = list.filter(a => a.status === alarmStatusFilter.value)
  if (alarmCategoryFilter.value) list = list.filter(a => a.category === alarmCategoryFilter.value)
  if (alarmSearchText.value) {
    const kw = alarmSearchText.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.incident_no || '').toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
  }
  return list
})

const autoHealCount = computed(() => alarmIncidentCategoryStats.value.filter(s => s.heal === 'auto').length)
const manualHealCount = computed(() => alarmIncidentCategoryStats.value.filter(s => s.heal !== 'auto').length)

function goToFaultDetail(record) {
  router.push('/ops/incident/' + (record.incident_no || record.id))
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
    router.push('/ops/incident/' + record.incident_no)
  }
}

function openRelatedDrawer(record) {
  relatedDrawerRecord.value = record
  filteredAlertVisible.value = false
  relatedDrawerVisible.value = true
}

onMounted(() => { fetchAlarmData(); window.addEventListener('resize', onDrawerResize) })
onBeforeUnmount(() => {
  if (topnChart) topnChart.destroy()
  if (funnelChart) funnelChart.destroy()
  if (alarmTrendChart) alarmTrendChart.destroy()
  window.removeEventListener('resize', onDrawerResize)
})
watch(alarmTrendData, () => { nextTick(() => renderAlarmTrendChart()) }, { deep: true })
watch(alarmCategoryStats, () => { nextTick(() => renderTopNChart()) }, { deep: true })
watch(alarmFunnel, () => { nextTick(() => renderFunnelChart()) }, { deep: true })
</script>

<style scoped>
.alarm-analysis-page { display: flex; flex-direction: column; gap: 8px; padding: 0; height: calc(100vh - 48px); overflow-y: auto; box-sizing: border-box; }
.aa-hero-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.aa-hero-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; width: 100%; }
.aa-hero-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.aa-hero-info { flex: 1; min-width: 0; }
.aa-hero-val { font-size: 20px; font-weight: 700; color: #1A1A1A; line-height: 1.2; }
.aa-hero-label { font-size: 12px; color: #595959; margin-top: 1px; }
.aa-hero-sub { font-size: 10px; color: #8C8C8C; }
.aa-hero-trend { font-size: 10px; margin-top: 0; text-align: right; white-space: nowrap; }
.aa-hero-trend.up { color: #52C41A; }
.aa-chart-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.aa-chart-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; min-height: 0; }
.aa-chart-title { font-size: 12px; font-weight: 600; color: #1A1A1A; flex-shrink: 0; margin-bottom: 4px; }
.aa-funnel-rate { color: #52c41a; }
.aa-chart-container { flex: 1; min-height: 200px; overflow: visible; position: relative; }
.aa-root-cause-link { color: #007DFF; cursor: pointer; text-decoration: none; }
.aa-root-cause-link:hover { text-decoration: underline; color: #0056b3; }
.aa-table-card { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 14px; }
.aa-table-card :deep(.ant-pagination) { margin-top: 8px !important; }
.aa-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-shrink: 0; }
.aa-table-title { font-size: 14px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 6px; }
.aa-table-actions { display: flex; align-items: center; gap: 8px; }
.aa-table-link { font-size: 12px; color: var(--brand, #007DFF); cursor: pointer; text-decoration: none; }
.aa-table-link:hover { text-decoration: underline; }
.action-text-links { display: flex; gap: 10px; white-space: nowrap; }
.aa-related-link { color: var(--brand, #007DFF); cursor: pointer; font-weight: 500; }
.aa-related-link:hover { text-decoration: underline; }
.related-drawer-incident { font-size: 13px; color: #595959; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.related-drawer-footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; text-align: right; }
.aa-empty-text { font-size: 13px; color: #8C8C8C; text-align: center; padding: 24px; }
.aa-category-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.aa-cat-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: #595959; cursor: pointer; transition: all 0.2s; border: 1px solid #e8e8e8; }
.aa-cat-tag:hover { border-color: var(--brand, #007DFF); color: var(--brand, #007DFF); }
.aa-cat-tag.active { background: var(--brand, #007DFF); color: #fff; border-color: var(--brand, #007DFF); }
.aa-cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.aa-cat-summary { font-size: 11px; color: #8C8C8C; margin-left: 8px; }
.aa-category-view { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; }
.aa-cat-group { border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
.aa-cat-group-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.aa-cat-group-title { font-size: 13px; font-weight: 600; color: #1A1A1A; }
.aa-cat-group-desc { font-size: 11px; color: #8C8C8C; }
.aa-cat-group-list { padding: 8px 14px; }
.aa-cat-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
.aa-cat-item:last-child { border-bottom: none; }
.aa-cat-item-title { color: var(--brand, #007DFF); cursor: pointer; font-size: 13px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aa-cat-item-title:hover { text-decoration: underline; }
.aa-cat-item-id { font-size: 11px; color: #8C8C8C; flex-shrink: 0; }
.aa-cat-empty { font-size: 12px; color: #8C8C8C; padding: 12px; text-align: center; }
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

/* 降噪效果列 */
.noise-reduction-cell { display: flex; align-items: center; gap: 6px; }
.noise-reduction-bar { width: 60px; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; flex-shrink: 0; }
.noise-reduction-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.noise-reduction-fill.high { background: #52c41a; }
.noise-reduction-fill.medium { background: #1890ff; }
.noise-reduction-fill.low { background: #d9d9d9; }
.noise-reduction-value { font-size: 12px; font-weight: 500; color: #1a1a1a; }

/* 告警降噪过滤统计卡片 */
.aa-filter-stats { flex: 1; display: flex; flex-direction: column; gap: 16px; min-height: 0; margin-top: 16px; }
.aa-funnel-bar { display: flex; align-items: center; gap: 6px; background: #fafafa; border-radius: 8px; padding: 10px 8px; border: 1px solid #f0f0f0; }
.aa-funnel-stage { display: flex; flex-direction: column; align-items: center; flex: 1; }
.aa-funnel-num { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.aa-funnel-num.aa-funnel-filtered { color: #fa8c16; }
.aa-funnel-num.aa-funnel-kept { color: #52c41a; }
.aa-funnel-label { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
.aa-funnel-arrow { font-size: 14px; color: #d9d9d9; flex-shrink: 0; }
.aa-filter-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.aa-filter-card-item { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.aa-filter-card-title { font-size: 12px; font-weight: 500; }
.aa-filter-card-title.critical { color: #ff4d4f; }
.aa-filter-card-title.warning { color: #fa8c16; }
.aa-filter-card-title.info { color: #1890ff; }

/* 统一 Drawer 样式 */
.rd-overview { background: #f6f8fa; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
.rd-overview-main { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #1a1a1a; }
.rd-overview-label { color: #8c8c8c; font-size: 13px; }
.rd-overview-flow-text { font-weight: 600; font-size: 16px; }
.rd-overview-sep { color: #d9d9d9; margin: 0 4px; }
.rd-overview-rate { font-weight: 700; font-size: 18px; }
.rd-overview-rules { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; font-size: 13px; color: #8c8c8c; }
.rd-overview-rules-label { color: #595959; font-weight: 500; }
.rd-overview-rule { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
.rd-section-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.rd-filtered-section { margin-top: 16px; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
.rd-filtered-toggle { padding: 10px 14px; font-size: 12px; font-weight: 500; color: #595959; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fafafa; transition: background 0.2s; }
.rd-filtered-toggle:hover { background: #f0f0f0; }
.rd-filtered-list { padding: 8px 14px; display: flex; flex-direction: column; gap: 6px; }
.rd-filtered-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.rd-filtered-item:last-child { border-bottom: none; }
.rd-filtered-title { flex: 1; color: #1a1a1a; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-filtered-reason { color: #8c8c8c; font-size: 11px; flex-shrink: 0; }
</style>
