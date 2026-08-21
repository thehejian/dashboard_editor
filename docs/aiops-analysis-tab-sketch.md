# 告警分析 Tab — RealtimeView 内完整草图

---

## 整体 Tab 结构

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [告警分析] [当前告警] [历史告警] [被屏蔽] [告警日志] [维护经验] [智能检测]                │
│    ▲                                                                         │
│    └── 新增 Tab，插在最前面；其余 Tab 完全不动                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 告警分析 Tab 内容 — 完整 ASCII 草图

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  [告警分析] [当前告警] [历史告警] [被屏蔽] [告警日志] [维护经验] [智能检测]                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  【AI运维成效概览 — Hero Metric 行】                                                 │ │
│  │                                                                                    │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌──────────────┐ │ │
│  │  │  🤖 AI自动闭环数              │  │  📉 告警降噪率              │  │  ⏱️ 节省人工时 │ │ │
│  │  │                             │  │                             │  │              │ │ │
│  │  │         3,452                │  │         91.5%               │  │      280     │ │ │
│  │  │       次 / 近30天             │  │   100,000 → 8,500          │  │    小时      │ │ │
│  │  │                             │  │    (聚合后有效事件)          │  │  / 近30天    │ │ │
│  │  │   [↑ 12% vs上月]            │  │   [↑ 5.2% vs上月]           │  │  [↑ 38h]    │ │ │
│  │  └─────────────────────────────┘  └─────────────────────────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐  ┌────────────────────┐ │
│  │  【TopN 告警分类分布】        │  │  【降噪漏斗】              │  │  【处理趋势】       │ │
│  │                              │  │                          │  │                    │ │
│  │  容量类  ████████████  45%    │  │  原始告警                │  │  次数              │ │
│  │  阈值类  ████████        30%  │  │   100,000                │  │  500 ┤       ╱╲  │ │
│  │  硬件类  ████            15%  │  │        ↓ 频次去重        │  │    ┤    ╱  ╲   │ │
│  │  网络类  ██              7%   │  │     85,000               │  │  300 ┤  ╱    ╲  │ │
│  │  证书类  ▌              2%   │  │        ↓ 拓扑聚合        │  │    ┤╱      ╲__│ │
│  │  服务类  ░               1%   │  │     42,000               │  │  100 ┤            │ │
│  │  合规类  ░               0%   │  │        ↓ 有效事件        │  │    ┤             │ │
│  │                              │  │     8,500                │  │    ┼────────────日期│ │
│  │                              │  │                          │  │                    │ │
│  │                              │  │  降噪率: 91.5%           │  └────────────────────┘ │
│  │                              │  │  [████████████░░░░]     │                          │
│  │                              │  └──────────────────────────┘                          │
│  └──────────────────────────────┴──────────────────────────┴──────────────────────────┘  │
│                                                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  筛选: [🤖 全部聚合▼] [时间范围▼] [🔍 搜索事件、根因____________________] [🔄 刷新]    │  │
│  ├────────────────────────────────────────────────────────────────────────────────────┤  │
│  │  ID          │ 根因摘要                        │ 关联│ 级别  │ 分类   │ 状态   │处理人│操作│  │
│  ├────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ INC-0720     │ 购物车链路DB连接耗尽引发雪崩      │  5 │🔴P1  │ 服务类 │ 自愈中 │AI自动│🤖分析│👁️ │  │
│  │ INC-0718     │ 用户服务Redis缓存击穿登录超时      │  1 │🟠P2  │ 阈值类 │ 已闭环 │AI自动│🤖分析│👁️ │  │
│  │ INC-0715     │ 支付回调MQ消费线程池耗尽           │  1 │🟠P2  │ 服务类 │ 已闭环 │AI自动│🤖分析│👁️ │  │
│  │ INC-0722     │ 库存服务扣减接口P99突增            │  1 │🟡P3  │ 阈值类 │ 排查中 │ 张工 │🤖分析│👁️ │  │
│  │ UNLINKED-11  │ 网络丢包率过高                    │  1 │🟠P2  │ 网络类 │ 告警中 │ —    │🤖分析│👁️ │  │
│  │ UNLINKED-2   │ 磁盘空间不足                      │  1 │🔴P1  │ 容量类 │ 告警中 │ —    │🤖分析│👁️ │  │
│  │ UNLINKED-8   │ SSL证书即将过期                   │  1 │🟢P3  │ 证书类 │ 告警中 │ —    │🤖分析│👁️ │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  [◀ 1 2 3 ... 85 ▶]                                                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 与「当前告警」Tab 的对比

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  【告警分析 Tab】                            【当前告警 Tab】                          │
│                                                                                  │
│  数据源: Incident 聚合视图                       数据源: 原始告警列表                   │
│  粒度: 一个 Incident = N条告警聚合               粒度: 一条条原始告警                    │
│  行数: ~12条（聚合后）                           行数: ~156条（当前firing）                │
│  列: ID/根因摘要/关联数/级别/分类/状态/处理人/操作  列: 级别/名称/资源/指标/当前值/阈值/状态/持续/时间/操作 │
│  目的: ROI展示 + 快速定位重点事件                  目的: 实时告警监控 + 逐条处理              │
│  AI分析按钮 → 跳转全页 /alarm/analysis/:id       AI分析按钮 → 侧滑详情 + AI分析Tab          │
│                                                                                  │
│  共同点:                                                                        │
│  - 都有筛选栏（搜索/时间/级别）                                                   │
│  - 都有 AI分析 按钮（操作列第1个）                                                 │
│  - 都有 查看 按钮（操作列第2个）                                                   │
│  - 都复用同一套 mock 数据（alerts + incidents）                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 两个 Tab 的数据共享关系

```
                          ┌──────────────────────┐
                          │  mockData.js alerts  │
                          │  (12条原始告警)       │
                          │  + category 字段     │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
              │ 按incident│   │ 按category│   │ 按level   │
              │ _id分组    │   │ 统计      │   │ 统计      │
              └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                    │               │               │
         ┌──────────┴───┐   ┌──────┴──────┐  ┌────┴─────┐
         │              │   │             │  │          │
    ┌────▼────┐   ┌─────▼─────┐  ┌───────▼───┐  ┌──────▼────┐
    │告警分析  │   │当前告警   │  │ 降噪漏斗  │  │ 级别Donut │
    │ Tab     │   │ Tab       │  │ (图表)    │  │ (图表)    │
    │Incident │   │原始告警   │  │           │  │           │
    │列表     │   │列表       │  │           │  │           │
    └────┬────┘   └─────┬─────┘  └───────────┘  └───────────┘
         │              │
         │              │
    【AI分析按钮】  【AI分析按钮】
         │              │
         │              │
    router.push(`/alarm/  openDetail()
    analysis/${id}`)      + side panel
         │
         ▼
  ┌──────────────────────┐
  │ AlarmAnalysisView    │
  │ (新建全页组件)        │
  │ 左70% + 右28%        │
  └──────────────────────┘
```

---

## 告警分析 Tab 关键实现要点

```js
// === state ===
const analysisTabLoading = ref(false)
const heroStats = ref({ closedCount: 0, reductionRate: 0, savedHours: 0 })
const incidentList = ref([])    // 聚合后的 Incidents
const categoryStats = ref([])   // TopN 分类统计
const funnelData = ref({ raw: 0, dedup: 0, agg: 0, rate: 0 })
const trendData = ref({ labels: [], ai: [], manual: [] })

// === fetch（onMounted 或 tab 切换时触发）===
async function fetchAnalysisTabData() {
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

// === AI分析按钮点击 ===
const openAlarmAnalysis = function(incident) {
  router.push(`/alarm/analysis/${incident.incident_no}`)
}

// === 图表渲染（onMounted 后调用）===
// renderAnalysisCategoryChart()  — 横向 Bar
// renderFunnelChart()            — 漏斗（CSS/SVG 实现，非 G2）
// renderTrendChart2()            — 双线 Area（G2）
```

```css
/* === 新增 CSS === */
/* Hero 行 */
.hero-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.hero-card {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border: 1px solid #bae7ff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.hero-val { font-size: 28px; font-weight: 700; color: var(--brand); }
.hero-sub { font-size: 12px; color: #8c8c8c; margin-top: 2px; }
.hero-trend { font-size: 12px; margin-top: 8px; }
.hero-trend.up { color: #52c41a; }
.hero-trend.down { color: #f5222d; }

/* 图表行 */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 12px;
  margin-bottom: 12px;
}
.analysis-chart-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.analysis-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

/* 分类横向 Bar */
.cat-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 6px;
}
.cat-bar-label { width: 60px; flex-shrink: 0; color: #595959; }
.cat-bar-track { flex: 1; height: 12px; background: #f0f0f0; border-radius: 6px; overflow: hidden; }
.cat-bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
.cat-bar-pct { width: 40px; text-align: right; color: #8c8c8c; flex-shrink: 0; }

/* 漏斗（纯 CSS） */
.funnel-step {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 4px;
  position: relative;
}
.funnel-bar {
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.funnel-arrow { text-align: center; color: #8c8c8c; font-size: 16px; line-height: 1; }

/* 趋势面积图容器 */
.trend-chart-wrap { height: 140px; }

/* 表格 */
.analysis-table { flex: 1; min-height: 0; }
.analysis-table :deep(.ant-table-wrapper) { flex: 1; }
.analysis-table :deep(.ant-table) { font-size: 13px; }
```

---

## 实现优先级（最小改动顺序）

| 步骤 | 改动 | 验证点 |
|------|------|--------|
| 1 | `mockData.js` 加 category 字段 | 12条 alerts 各有分类 |
| 2 | `server.js` 加 3 个新接口 | curl 可访问 |
| 3 | `router.js` 加 `/alarm/analysis/:id` 路由 | 路由可访问 |
| 4 | `RealtimeView.vue` 新增 Tab pane + state + fetch | Tab 可见，数据加载 |
| 5 | `RealtimeView.vue` 新增图表渲染 + Hero 行 | 图表渲染正常 |
| 6 | 新建 `AlarmAnalysisView.vue` | 全页打开正常 |
| 7 | 连线：AI分析按钮 → router.push | 跳转正常 |
