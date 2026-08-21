# AI 告警分析 — 全文件影响分析与 ASCII 草图

## 一、全局影响范围确认

经过仔细排查，现有代码中 **已有基础**：
- `mockData.js:131-143` 的 12 条 alerts 已有 `incident_id` 字段（关联 SRE 故障）
- `server.js:1100-1200` 已有完整 `MOCK_INCIDENTS` 数据（4 条故障记录）
- `server.js:1880-1946` 已有聚合接口 `POST /api/sre/incidents/aggregate`
- `server.js:1880` 已有查询接口 `GET /api/sre/incidents`
- `RealtimeView.vue` 已有 AI 分析侧滑 + Tab（上一轮已实现）

**本任务只需在已有基础上添加新能力，不破坏现有功能。**

---

## 二、涉及文件清单（共 4 个文件）

| # | 文件 | 类型 | 改动性质 |
|---|------|------|---------|
| 1 | `server/db/mockData.js` | 修改 | alerts 加 category 字段 |
| 2 | `server/server.js` | 修改 | 新增 3 个接口 |
| 3 | `src/views/alarm/RealtimeView.vue` | 修改 | 新增「告警分析」Tab |
| 4 | `src/views/alarm/AlarmAnalysisView.vue` | **新建** | 告警分析详情全页 |
| 5 | `src/router/index.js` | 修改 | 新增路由 |

---

## 三、文件 1: server/db/mockData.js

### 改动位置：lines 130-143（alerts 数组）

```js
// 改动前（每条 alert 无 category 字段）
{ id: 1, rule_id: 1, ci_id: 1, level: 'critical',
  title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)',
  metric: 'CPU使用率', current_value: '95%', threshold: '> 90%',
  ...
  incident_id: 'INC-2026-0720', suggestion: '...' }

// 改动后（新增 category 字段，关联到7大类）
{ id: 1, rule_id: 1, ci_id: 1, level: 'critical',
  title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)',
  metric: 'CPU使用率', current_value: '95%', threshold: '> 90%',
  category: '阈值类',          // ← 新增
  ai_closed: false,           // ← 新增：AI是否自动闭环
  closed_by: 'manual',        // ← 新增：manual|ai
  suppression_reason: null,   // ← 新增：频次去重原因
  ...
  incident_id: 'INC-2026-0720', suggestion: '...' }
```

**12 条 alerts 的 category 映射**：

| id | metric | category |
|----|--------|----------|
| 1 | CPU使用率 | 阈值类 |
| 2 | 磁盘使用率 | 容量类 |
| 3 | 复制延迟 | 服务类 |
| 4 | 内存使用率 | 阈值类 |
| 5 | 响应时间 | 阈值类 |
| 6 | 5xx错误率 | 服务类 |
| 7 | 连接数 | 容量类 |
| 8 | 证书剩余天数 | 证书类 |
| 9 | Pod重启率 | 服务类 |
| 10 | 积压量 | 容量类 |
| 11 | 丢包率 | 网络类 |
| 12 | 时间偏移 | 阈值类 |

---

## 四、文件 2: server/server.js

### 4.1 新增接口 1：告警聚合事件列表

**位置**：server.js 末尾（line ~2088，在 `app.listen` 之前）

```js
// GET /api/alarm/incidents — 告警聚合事件（供告警分析 Tab 使用）
app.get('/api/alarm/incidents', (req, res) => {
  const alerts = getTable('alerts')
  // 按 incident_id 分组聚合
  const groupMap = {}
  for (const a of alerts) {
    const key = a.incident_id || 'unlinked-' + a.id
    if (!groupMap[key]) {
      groupMap[key] = {
        incident_no: a.incident_id || 'UNLINKED-' + a.id,
        root_cause: a.title,           // 简化：用第一条告警标题作摘要
        level: a.level,
        category: a.category || '其他',
        status: a.status === 'firing' ? 'investigating' : 'resolved',
        affected_count: 1,
        handler: a.ai_closed ? 'ai' : 'manual',
        created_at: a.trigger_time,
        alerts: [],
      }
    }
    groupMap[key].alerts.push(a)
    groupMap[key].affected_count++
    if (a.level === 'critical') groupMap[key].level = 'critical'
  }
  const data = Object.values(groupMap).sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json({ success: true, data })
})
```

### 4.2 新增接口 2：告警分析详情（聚合+原始告警+AI分析）

```js
// GET /api/alarm/incidents/:id — 单个 Incident 完整分析数据
app.get('/api/alarm/incidents/:id', (req, res) => {
  const alerts = getTable('alerts')
  const incId = req.params.id
  // 找到属于该 incident 的所有告警
  const relatedAlerts = alerts.filter(a => a.incident_id === incId || a.id === parseInt(incId))
  if (!relatedAlerts.length) return res.status(404).json({ success: false, message: '未找到' })

  // 关联 SRE 故障数据（如有）
  const sreIncident = MOCK_INCIDENTS.find(i => i.id === incId)

  // 分类统计
  const categoryCounts = {}
  relatedAlerts.forEach(a => {
    const cat = a.category || '其他'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  res.json({
    success: true,
    data: {
      incident: {
        incident_no: incId,
        title: relatedAlerts[0].title,
        root_cause: sreIncident?.description || 'AI 正在分析根因...',
        level: relatedAlerts.some(a => a.level === 'critical') ? 'critical' : 'warning',
        category: relatedAlerts[0].category || '阈值类',
        status: sreIncident?.status || 'investigating',
        affected_count: relatedAlerts.length,
        handler: 'ai',
        evidence: sreIncident?.timeline || relatedAlerts.map(a => ({
          time: a.trigger_time, type: 'alert', detail: a.title,
        })),
        ai_confidence: sreIncident ? 87 : 72,
        suggestions: ['检查相关服务状态', '查看应用日志定位异常', '必要时执行回滚'],
      },
      relatedAlerts,
      categoryBreakdown: Object.entries(categoryCounts)
        .map(([cat, count]) => ({ category: cat, count }))
        .sort((a, b) => b.count - a.count),
    }
  })
})
```

### 4.3 新增接口 3：Hero Metric 概览数据

```js
// GET /api/alarm/overview-stats
app.get('/api/alarm/overview-stats', (req, res) => {
  const alerts = getTable('alerts')
  const firing = alerts.filter(a => a.status === 'firing')
  const resolved = alerts.filter(a => a.status === 'resolved')

  // 分类统计
  const byCategory = {}
  firing.forEach(a => {
    const cat = a.category || '其他'
    byCategory[cat] = (byCategory[cat] || 0) + 1
  })
  const categoryStats = Object.entries(byCategory)
    .map(([cat, count]) => ({ category: cat, count, pct: Math.round(count / firing.length * 100) }))
    .sort((a, b) => b.count - a.count)

  // 降噪数据（模拟）
  const rawAlerts = 100000
  const afterDedup = 85000
  const afterAgg = 8500

  res.json({
    success: true,
    data: {
      heroStats: {
        closedCount: resolved.length + 3452,    // 已有 resolved + mock 历史
        reductionRate: 91.5,
        savedHours: 280,
      },
      categoryStats,
      funnelData: {
        raw: rawAlerts, dedup: afterDedup, agg: afterAgg, rate: 91.5,
      },
      trendData: {
        labels: ['06-11', '06-12', '06-13', '06-14', '06-15', '06-16', '06-17'],
        aiClosed: [120, 135, 142, 155, 168, 180, 195],
        manualClosed: [300, 290, 275, 260, 240, 230, 220],
      },
    }
  })
})
```

---

## 五、文件 3: src/views/alarm/RealtimeView.vue

### 改动位置 1：Tab 结构（line ~3）

```html
<!-- 改动前 -->
<a-tabs v-model:activeKey="activeTab" class="page-tabs">
  <a-tab-pane key="current" tab="当前告警">...</a-tab-pane>
  <a-tab-pane key="history" tab="历史告警">...</a-tab-pane>
  ...

<!-- 改动后 -->
<a-tabs v-model:activeKey="activeTab" class="page-tabs">
  <a-tab-pane key="analysis" tab="告警分析">
    <!-- 全新的聚合事件视图，内容见下方草图 -->
    <div class="analysis-tab-content">...</div>
  </a-tab-pane>
  <a-tab-pane key="current" tab="当前告警">
    <!-- 完全不动 -->
    ...
  </a-tab-pane>
  <a-tab-pane key="history" tab="历史告警">...</a-tab-pane>
  ...
```

### 改动位置 2：新增 state（line ~555 附近）

```js
// 新增 state
const analysisTabLoading = ref(false)
const heroStats = ref({ closedCount: 0, reductionRate: 0, savedHours: 0 })
const incidentList = ref([])
const categoryStats = ref([])
const funnelData = ref({ raw: 0, dedup: 0, agg: 0, rate: 0 })
const trendData = ref({ labels: [], ai: [], manual: [] })
const analysisScrollRef = ref(null)
const analysisTabsWrapRef = ref(null)
```

### 改动位置 3：新增 fetch 函数（onMounted 中调用）

```js
async function fetchAnalysisData() {
  analysisTabLoading.value = true
  try {
    const [statsRes, incRes] = await Promise.all([
      fetch('/api/alarm/overview-stats').then(r => r.json()),
      fetch('/api/alarm/incidents').then(r => r.json()),
    ])
    if (statsRes.success) {
      heroStats.value = statsRes.data.heroStats
      categoryStats.value = statsRes.data.categoryStats
      funnelData.value = statsRes.data.funnelData
      trendData.value = statsRes.data.trendData
    }
    if (incRes.success) incidentList.value = incRes.data
  } finally {
    analysisTabLoading.value = false
  }
}
```

### 改动位置 4：新增图表渲染函数

```js
// 复用已有的 renderDonutChart/renderBarChart 模式
function renderAnalysisCategoryChart() { /* 横向 Bar：7大类占比 */ }
function renderFunnelChart() { /* 漏斗图：原始→去重→聚合→有效 */ }
function renderTrendChart2() { /* 双线面积：AI处理 vs 人工处理 */ }
```

### 改动位置 5：新增 CSS

```css
.analysis-tab-content { display: flex; flex-direction: column; height: 100%; }
.hero-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
.hero-card { background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%); border-radius: 8px; padding: 16px; text-align: center; }
.hero-val { font-size: 28px; font-weight: 700; color: var(--brand); }
.hero-label { font-size: 13px; color: #595959; margin-top: 4px; }
.hero-trend { font-size: 12px; margin-top: 6px; }
.chart-row { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 12px; margin-bottom: 12px; }
.trend-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px; }
.analysis-table { flex: 1; min-height: 0; }
```

---

## 六、文件 4: src/views/alarm/AlarmAnalysisView.vue（新建）

**新建文件**，参考 SRECopilotView 的左右分栏布局：

```html
<template>
  <div class="alarm-analysis-view">
    <!-- 顶部导航栏 -->
    <div class="aa-header">
      <div class="aa-header-left">
        <button class="aa-back-btn" @click="goBack"><i class="fa-solid fa-arrow-left"></i></button>
        <div class="aa-header-info">
          <h1 class="aa-title">智能告警分析</h1>
          <div class="aa-subtitle">
            <span class="aa-incident-no">{{ incident?.incident_no }}</span>
            <a-tag :color="levelColor">{{ levelText }}</a-tag>
            <a-tag color="purple" v-if="incident?.handler === 'ai'"><i class="fa-solid fa-robot"></i> AI自动聚合</a-tag>
            <a-tag :color="statusColor">{{ statusText }}</a-tag>
          </div>
        </div>
      </div>
      <div class="aa-header-right">
        <a-button @click="continueInAI"><i class="fa-solid fa-comment-dots"></i> 在AI助手继续分析</a-button>
        <a-button type="primary" @click="triggerHealing" v-if="canHeal"><i class="fa-solid fa-bolt"></i> 一键自愈</a-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="aa-tabs">
      <button :class="['aa-tab', { active: activeTab === 'analysis' }]" @click="activeTab='analysis'">
        <i class="fa-solid fa-magnifying-glass-chart"></i> 故障分析
      </button>
      <button :class="['aa-tab', { active: activeTab === 'postmortem' }]" @click="activeTab='postmortem'">
        <i class="fa-solid fa-file-lines"></i> 复盘沉淀
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="aa-body" v-if="!loading">
      <!-- 故障分析 Tab -->
      <div v-if="activeTab === 'analysis'" class="aa-layout">
        <!-- 左侧 70% -->
        <div class="aa-main-left">
          <!-- Row 1: RCA + 告警时间线 -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-left">
              <RCASection :incident="incident" />
            </div>
            <div class="aa-cell aa-cell-right">
              <AlertTimeline :events="incident?.evidence || []" />
            </div>
          </div>
          <!-- Row 2: 原始告警明细 -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-full">
              <RelatedAlertsSection :alerts="relatedAlerts" :categoryBreakdown="categoryBreakdown" />
            </div>
          </div>
          <!-- Row 3: AI分析结论 -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-full">
              <AIConclusionSection :incident="incident" />
            </div>
          </div>
        </div>

        <!-- 右侧 28% -->
        <div class="aa-main-right">
          <AIRecommendationSection :incident="incident" @execute="executeStep" />
          <RelatedMetricsSection :alerts="relatedAlerts" />
          <JumpLinksSection :incident="incident" />
        </div>
      </div>

      <!-- 复盘 Tab -->
      <div v-if="activeTab === 'postmortem'" class="aa-postmortem">
        <a-empty description="暂无复盘报告" />
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else class="aa-loading"><a-spin tip="加载分析数据..." /></div>
  </div>
</template>
```

**ASCII 草图（完整页面）**：

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  ← 返回                    🔴 INC-2026-0720               [🤖 AI继续分析] [⚡自愈] │
│  智能告警分析                                                                        │
│  <购物车核心交易链路数据库连接耗尽>      [🔴 P1] [AI自动聚合] [自愈中]              │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [🔍 故障分析]  [📝 复盘沉淀]                                                       │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────┐  ┌──────────────────┐ │
│  │ [左侧 70%]                                              │  │ [右侧 28%]       │ │
│  │                                                         │  │                  │ │
│  │  ┌─────────────────────────┐  ┌─────────────────────┐  │  │  🤖 AI处置建议  │ │
│  │  │  根因分析 (RCA)          │  │  告警时间线          │  │  │                  │ │
│  │  │                         │  │                     │  │  │  1. 检查数据库  │ │
│  │  │  根因: 数据库连接池耗尽   │  │  08:58 🔴 P99突增  │  │  │     连接池配置  │ │
│  │  │  置信度: ██████████ 87%  │  │  09:00 🤖 AI检测   │  │  │                  │ │
│  │  │                         │  │  09:02 ⚡ 流量隔离   │  │  │  2. 扩容连接池   │ │
│  │  │  证据链:                 │  │  09:05 🔧 扩容操作   │  │  │     HikariCP    │ │
│  │  │  📊 08:58 响应时间3500ms │  │  09:15 ✅ 指标恢复  │  │  │     50→250     │ │
│  │  │  📊 09:00 AI识别根因    │  │                     │  │  │                  │ │
│  │  │  📊 09:02 自动流量隔离  │  │  [更多时间线 →]     │  │  │  [✅ 一键自愈]   │ │
│  │  └─────────────────────────┘  └─────────────────────┘  │  │  [📋 生成工单]   │ │
│  │                                                         │  │                  │ │
│  │  ┌───────────────────────────────────────────────────┐  │  │  📊 关联指标    │ │
│  │  │  原始告警明细 (5条关联)                            │  │  │                  │ │
│  │  │                                                   │  │  │  P99  3500ms → 22ms│ │
│  │  │  # │告警名称                │节点        │级别  │时间│  │  │  错误率 85%→0% │ │
│  │  │  1 │P99响应时间超限         │prod-order-01│ 🔴 │08:58│  │  │                  │ │
│  │  │  2 │连接数打满              │mysql-master  │ 🔴 │09:00│  │  │  [📈 趋势图 →]  │ │
│  │  │  3 │5xx错误率飙升           │lb-api        │ 🟠 │09:01│  │  └──────────────────┘ │
│  │  │  ...                                   [展开全部5条]│  │                  │ │
│  │  └───────────────────────────────────────────────────┘  │  ┌──────────────────┐ │
│  │                                                         │  │  🔗 跳转链接     │ │
│  │  ┌───────────────────────────────────────────────────┐  │  │                  │ │
│  │  │  AI 分析结论                                       │  │  │  📊 关联仪表盘  │ │
│  │  │                                                   │  │  │  📝 相关日志    │ │
│  │  │  本Incident由5条原始告警聚合而成，根因为            │  │  │  💻 主机详情    │ │
│  │  │  数据库连接池耗尽导致全链路雪崩。AI在09:00自动      │  │  │                  │ │
│  │  │  识别根因并执行流量隔离，09:15指标恢复。建议：      │  │  └──────────────────┘ │
│  │  │  1. 检查连接池配置  2. 增加监控告警阈值  3. 压测验证│  │                  │ │
│  │  └───────────────────────────────────────────────────┘  │  ┌──────────────────┐ │
│  │                                                         │  │  🤖 继续追问    │ │
│  └─────────────────────────────────────────────────────────┘  │  │                  │ │
│                                                                │  │ [输入框     →]│ │
│                                                                │  └──────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、文件 5: src/router/index.js

### 改动位置：line 17 附近（alarm children）

```js
// 改动前
{ path: 'current', component: () => import('../views/alarm/RealtimeView.vue') },
{ path: 'events', component: () => import('../views/alarm/EventsView.vue') },

// 改动后
{ path: 'analysis', name: 'alarm-analysis', component: () => import('../views/alarm/AlarmAnalysisView.vue') },
{ path: 'current', component: () => import('../views/alarm/RealtimeView.vue') },
{ path: 'events', component: () => import('../views/alarm/EventsView.vue') },
```

**访问路径**：`/alarm/analysis/INC-2026-0720`

---

## 八、数据流向总图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  用户操作路径                                                               │
│                                                                             │
│  浏览器访问 /alarm/current                                                  │
│       │                                                                     │
│       ├── 默认显示「当前告警」Tab（原有功能不变）                              │
│       │                                                                     │
│       └── 点击「告警分析」Tab                                                │
│              │                                                              │
│              ├── GET /api/alarm/overview-stats    → Hero行 + 图表数据        │
│              │                                                              │
│              └── GET /api/alarm/incidents         → 聚合事件列表             │
│                     │                                                      │
│                     └── 点某行「🤖 AI分析」                                   │
│                            │                                               │
│                            └── router.push(`/alarm/analysis/${incident_no}`) │
│                                   │                                        │
│                                   ├── GET /api/alarm/incidents/:id          │
│                                   │         │                               │
│                                   │         ├── incident（聚合后根因）       │
│                                   │         ├── relatedAlerts（原始告警）   │
│                                   │         └── categoryBreakdown（分类统计）│
│                                   │                                        │
│                                   └── 渲染 AlarmAnalysisView               │
│                                         │                                   │
│                                         └── 点「在AI助手继续分析」             │
│                                                   │                          │
│                                                   └── window.__openAIAssistant()│
│                                                             ↓                │
│                                                        AIAssistant 面板打开    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 九、注意事项

1. **不影响现有功能**：`当前告警` Tab 完全不改动；`/ops/incident/:id` 路由不变
2. **复用已有数据**：incidents 数据来自 `MOCK_INCIDENTS`（已有），alerts 数据来自 `mockData.js`（需加 category）
3. **复用已有组件**：`AlarmAnalysisView.vue` 可复用 SRE 模块的 `RelatedAlertsPanel`、`RCAEvidencePanel` 等组件（调整 props 即可）
4. **路由参数**：`/alarm/analysis/:id` 中 id 是 incident_no（如 `INC-2026-0720`），非数字 ID
