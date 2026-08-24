# 告警分析页面完整变更记录（2026-08-21 ~ 2026-08-24）

> 本文档记录告警分析页面从零到完整的所有变更，供另一个系统完全还原。  
> 涉及文件：8个源码文件 + 3个测试文件 + 9个设计文档  
> 最后更新：2026-08-24

---

## 一、变更概览

| 日期 | 提交 | 描述 |
|---|---|---|
| 08-21 | `55b0e47` | 告警分析首页Tab + 详情页 + 后端聚合接口（从零搭建） |
| 08-21 | `192634d` | 告警分析独立路由 + 详情页拆分 |
| 08-21 | `01b5592` | 提升为顶级路由 + AiopsAppCards/HealingRecords组件抽取 |
| 08-22 | `e8e3180` | 回归首页内嵌Tab + 导航高亮修复 + 28条测试 |
| 08-22 | `3584b12` | G2图表显示修复 + 6条G2测试 |
| 08-22 | `1ae7157` | 移动端适配（1200/768/480三档断点） |
| 08-22 | `e518e69` | 图表从G2 Canvas改为SVG渲染 |
| 08-22 | `4213891` | UI优化：操作列文字链接、表头布局、组件间距 |
| 08-22 | `fc3cf63` | 图表布局优化：填满容器、文字居中 |
| 08-22 | `6766f2c` | 图表从SVG换回G2默认样式 |
| 08-22 | `a98a989` | 表头actions靠右 + 操作列统一跳转SRE故障中心 |
| 08-22 | `1c79c07` | 图表高度90px→150px |
| 08-22 | `e73fd09`~`114e411` | 图表轴标签反复调试（隐藏/恢复/旋转） |
| 08-23 | `cd4e9c7` | 漏斗图数据归一化到0-100 + 修复有效事件字段bug |
| 08-23 | `896788f` | 图表经验教训文档 |
| 08-23 | `806d06b` | 表头筛选(分类/状态/处理人) + 关联告警蓝色链接+drawer |
| 08-23 | `e4950ce` | drawer改为告警表格 + 查看告警根因按钮 |
| 08-23 | `5d3f20d` | drawer宽度改为90vw + 组件标题去掉icon |
| 08-23 | `3196281` | 子组件header flex布局穿透修复 |
| 08-23 | `dd38a34` | drawer增加操作/查看详情列 + 查看全部跳转修复 |
| 08-23 | `8d95430` | drawer查看详情链接修正 + 主表格文案调整 |
| 08-23 | `a665105` | drawer链接→/alarm/current?alertId + 首页默认告警tab + app-card字号 |
| 08-24 | `d9fd342` | 自动修复记录点击跳转复盘沉淀 |
| 08-24 | `e451eea` | 图表高度150px→180px |

---

## 二、涉及文件清单

### 源码文件（必须）

| 文件 | 说明 |
|---|---|
| `src/views/alarm/AlarmAnalysisView.vue` | **主页面** — 5行布局：Hero指标→图表→表格→应用卡片→修复记录 + 关联告警drawer |
| `src/views/alarm/AlarmDetailView.vue` | **详情页** — 故障分析/复盘沉淀双tab，RCA+时间线+告警明细+AI建议 |
| `src/components/aiops/AiopsAppCards.vue` | **组件** — 需关注应用/云服务卡片网格 |
| `src/components/aiops/AiopsHealingRecords.vue` | **组件** — 自动修复记录列表 |
| `src/views/HomeView.vue` | **首页** — 三Tab（告警分析/AI运维/概览），默认显示告警分析 |
| `src/App.vue` | **导航** — 首页高亮规则包含 `/alarm-analysis*` |
| `src/router/index.js` | **路由** — 4条告警分析相关路由 |
| `server/server.js` | **后端** — 3个API端点（L2090-2216） |

### 测试文件

| 文件 | 说明 |
|---|---|
| `tests/alarm-analysis.spec.js` | 28条测试：Tab切换/布局/表格交互/详情页/异常检测 |
| `tests/g2-chart-display.spec.js` | 6条测试：Canvas渲染/像素内容/尺寸/JS错误 |

### 设计文档

| 文件 | 说明 |
|---|---|
| `docs/aiops-overview-design.md` | 概览页设计 |
| `docs/aiops-overview-sketch.md` | 概览页草图 |
| `docs/aiops-home-tab-sketch.md` | 首页Tab草图 |
| `docs/aiops-analysis-tab-sketch.md` | 分析Tab草图 |
| `docs/aiops-alarm-analysis-sketch.md` | 告警分析草图 |
| `docs/aiops-pages-sketch.md` | 全页面草图 |
| `docs/aiops-persona-journey.md` | 用户画像旅程 |
| `docs/aiops-gap-analysis.md` | 差距分析 |
| `docs/aiops-full-impact-analysis.md` | 全量影响分析 |
| `docs/chart-lessons-learned.md` | 图表开发经验教训 |

---

## 三、路由配置

```js
// src/router/index.js 新增路由
{ path: '/', redirect: '/aiops' },
{ path: '/overview', name: 'overview', component: HomeView },
{ path: '/aiops', name: 'aiops', component: HomeView },
{ path: '/alarm-analysis', redirect: '/overview?tab=alarm' },
{ path: '/alarm-analysis/:id', name: 'alarm-analysis-detail', component: AlarmDetailView },
```

### App.vue 导航高亮

```html
<!-- 首页：包含 /alarm-analysis* 路径 -->
<router-link to="/" class="nav-item"
  :class="{ active: $route.path === '/' || $route.path === '/overview'
    || $route.path === '/aiops' || $route.path.startsWith('/alarm-analysis') }">

<!-- 告警：排除 /alarm-analysis* 路径 -->
<router-link to="/alarm/current" class="nav-item"
  :class="{ active: $route.path.startsWith('/alarm') && !$route.path.startsWith('/alarm-analysis') }">
```

### HomeView 默认 Tab

```js
// 点击首页默认进入告警分析Tab
const homeTab = ref(route.path === '/aiops' ? 'alarm' : route.query.tab === 'alarm' ? 'alarm' : 'home')
```

---

## 四、后端 API（server.js L2090-2216）

### GET /api/alarm/overview-stats

返回 Hero 指标 + 分类统计 + 漏斗数据 + 趋势数据 + 修复记录。

```json
{
  "success": true,
  "data": {
    "heroStats": {
      "closedCount": 3452,
      "reductionRate": 91.5,
      "autoRate": 78.3,
      "savedHours": 280
    },
    "categoryStats": [
      { "category": "阈值类", "count": 12, "pct": 32 },
      { "category": "容量类", "count": 8, "pct": 21 }
    ],
    "funnelData": {
      "raw": 100000,
      "dedup": 85000,
      "agg": 8500,
      "rate": 91.5
    },
    "trendData": {
      "labels": ["06-11","06-12","06-13","06-14","06-15","06-16","06-17"],
      "aiClosed": [120,135,142,155,168,180,195],
      "manualClosed": [300,290,275,260,240,230,220]
    },
    "healingRecords": [
      {
        "id": 1,
        "time": "06-17 09:15",
        "alert": "K8s Pod频繁重启",
        "resource": "payment-service",
        "action": "平滑重启+拨测",
        "result": "success",
        "duration": "45s",
        "incidentId": "INC-2026-0720"
      }
    ]
  }
}
```

### GET /api/alarm/incidents

返回告警聚合事件列表（按 incident_id 分组）。

```json
{
  "success": true,
  "data": [
    {
      "incident_no": "INC-2026-0823-01",
      "title": "CPU使用率过高超过阈值85%",
      "root_cause": "CPU使用率过高超过阈值85%",
      "level": "critical",
      "category": "阈值类",
      "status": "investigating",
      "affected_count": 3,
      "handler": "ai",
      "created_at": "2026-08-23 14:32:18",
      "related_alerts": [
        {
          "id": 1,
          "title": "CPU使用率过高",
          "level": "critical",
          "status": "firing",
          "resource": "worker-1 (85%)",
          "trigger_time": "2026-08-23 14:32:18",
          "incident_id": "INC-2026-0823-01"
        }
      ]
    }
  ]
}
```

### GET /api/alarm/incidents/:id

返回单个 Incident 完整分析数据。

```json
{
  "success": true,
  "data": {
    "incident": {
      "incident_no": "INC-2026-0823-01",
      "title": "CPU使用率过高",
      "root_cause": "AI 正在分析根因...",
      "level": "critical",
      "severity": "P1",
      "category": "阈值类",
      "status": "investigating",
      "affected_count": 3,
      "handler": "ai",
      "evidence": [
        { "time": "14:32:18", "type": "alert", "detail": "CPU使用率过高 — worker-1" }
      ],
      "ai_confidence": 87,
      "suggestions": ["检查相关服务状态", "查看应用日志", "必要时执行回滚"],
      "can_heal": false
    },
    "relatedAlerts": [...],
    "categoryBreakdown": [
      { "category": "阈值类", "count": 2 }
    ]
  }
}
```

---

## 五、AlarmAnalysisView.vue 完整规格

### 5.1 页面布局（5行）

```
┌──────────────────────────────────────────────────────┐
│ Row 1: Hero 指标卡 (4列 grid)                        │
│ ┌──────────┬──────────┬──────────┬──────────┐        │
│ │AI自动闭环│ 告警降噪率│ AI接管率  │ 节省人工时│        │
│ │  数(蓝)  │   %(橙)  │   %(绿)  │  小时(红) │        │
│ └──────────┴──────────┴──────────┴──────────┘        │
├──────────────────────────────────────────────────────┤
│ Row 2: 图表 (3列 grid: 1fr 1fr 1.5fr)                │
│ ┌──────────────┬──────────────┬──────────────────┐   │
│ │ TopN分类分布  │  降噪漏斗    │ 处理趋势AI vs人工│   │
│ │  (G2 Canvas) │ (G2 Canvas)  │  (G2 Canvas)     │   │
│ │  height:180px│ height:180px │  height:180px    │   │
│ └──────────────┴──────────────┴──────────────────┘   │
├──────────────────────────────────────────────────────┤
│ Row 3: 告警分析列表 · 待处理                          │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [状态筛选▼] [搜索事件、根因...] [🔄]             │ │
│ │ 事件ID │ 根因摘要 │关联告警│级别│分类▼│状态▼│处理人▼│操作│
│ │        │(蓝链接)  │(蓝链接)│tag │filter│filter│filter│    │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Row 4: 需关注的应用 / 云服务           严重N 警告N    │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│ │app1││app2││app3││app4││app5││app6││app7││app8│   │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘   │
├──────────────────────────────────────────────────────┤
│ Row 5: 自动修复记录 · 近7天             查看全部 →    │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ✓ K8s Pod频繁重启  平滑重启+拨测      06-17 09:15│ │
│ │ ✓ 磁盘空间不足    清理日志+扩容20%    06-17 08:30│ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 5.2 Row 1: Hero 指标卡

| 指标 | 字段 | 图标 | 图标背景 | 趋势 |
|---|---|---|---|---|
| AI自动闭环数 | `heroStats.closedCount` | fa-robot | #F0F5FF / #007DFF | ↑ 12% vs上月 |
| 告警降噪率 | `heroStats.reductionRate` + `%` | fa-filter | #FFF7E6 / #FF7D00 | ↑ 5.2% vs上月 |
| AI接管率 | `heroStats.autoRate` + `%` | fa-bolt | #F6FFED / #07C160 | ↑ 5.2pp vs上月 |
| 节省人工时 | `heroStats.savedHours` + `小时 / 近30天` | fa-clock | #FFF1F0 / #F5222D | ↑ 38h vs上月 |

### 5.3 Row 2: 图表

#### TopN 告警分类分布
```js
// G2 配置
chart.data(data)  // [{ category: '阈值类', pct: 32 }, ...]
chart.coordinate({ transform: [{ type: 'transpose' }] })
chart.interval().encode('x', 'category').encode('y', 'pct')
chart.axis('x', { title: false }).axis('y', { title: false })
```

#### 降噪漏斗
```js
// 数据归一化到 0-100（解决 G2 transpose 强制旋转文字问题）
const data = [
  { step: '原始告警', count: 100 },
  { step: '频次去重', count: Math.round(f.dedup / f.raw * 100) },
  { step: '拓扑聚合', count: Math.round(f.agg / f.raw * 100) },
  { step: '有效事件', count: Math.round(f.rate / f.raw * 100) },
]
chart.interval().encode('x', 'step').encode('y', 'count')
chart.axis('x', { title: false, label: { autoRotate: false } })
chart.axis('y', { title: false, tickCount: 3, label: { autoRotate: false, formatter: d => d + '%' } })
```

#### 处理趋势 · AI vs 人工
```js
// 数据格式：[{ time: '06-11', type: 'AI处理', value: 120 }, ...]
chart.line().encode('x', 'time').encode('y', 'value').encode('color', 'type')
chart.axis('x', { title: false }).axis('y', { title: false })
```

### 5.4 Row 3: 告警分析列表

#### 表格列定义

```js
const alarmIncidentColumns = [
  { title: '事件ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true },
  { title: '根因摘要', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
  { title: '级别', key: 'level', width: 80 },
  { title: '分类', key: 'category', width: 80,
    filters: [
      { text: '容量类', value: '容量类' }, { text: '阈值类', value: '阈值类' },
      { text: '网络类', value: '网络类' }, { text: '证书类', value: '证书类' },
      { text: '服务类', value: '服务类' }, { text: '硬件类', value: '硬件类' }
    ],
    onFilter: (val, rec) => rec.category === val
  },
  { title: '状态', key: 'status', width: 80,
    filters: [
      { text: '进行中', value: 'investigating' },
      { text: '已闭环', value: 'resolved' },
      { text: '已屏蔽', value: 'suppressed' }
    ],
    onFilter: (val, rec) => rec.status === val
  },
  { title: '处理人', key: 'handler', width: 90,
    filters: [
      { text: 'AI自动', value: 'ai' },
      { text: '手动', value: 'manual' }
    ],
    onFilter: (val, rec) => val === 'ai' ? rec.handler === 'ai' : rec.handler && rec.handler !== 'ai'
  },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]
```

#### 单元格渲染

| 列 | 渲染 |
|---|---|
| 根因摘要 | `<span class="aa-root-cause-link">` 蓝色链接，点击跳转 `/ops/incident/:id` |
| 关联告警 | `<span class="aa-related-link">` 蓝色数字，点击打开 drawer |
| 级别 | `<a-tag>` P1紧急(红)/P2重要(橙)/P3提示(灰) |
| 分类 | `<a-tag>` 纯文字 |
| 状态 | `<a-tag>` 进行中(蓝)/已闭环(绿)/已屏蔽(灰) |
| 处理人 | AI: 紫色 🤖 AI自动 / 手动: 人名 |
| 操作 | 容量类: `故障自愈` / 其他: `AI分析` + 所有: `查看详情` |

#### 操作列交互

| 按钮 | 条件 | 行为 |
|---|---|---|
| 故障自愈 | `category === '容量类'` | Mock：将 status 改为 resolved |
| AI分析 | 非容量类 | 跳转 `/ops/incident/:incident_no` (SRE故障中心) |
| 查看详情 | 所有 | 跳转 `/ops/incident/:incident_no` |

### 5.5 Row 4: 需关注的应用 / 云服务

**AiopsAppCards 组件**

```
Props:
  apps: Array<{ name, type, status, score, alertCount, incidentNo, isRoot?, faultLabels? }>
  counts: { critical: number, warning: number }

Events:
  app-click(app) → /ops/incident/:incidentNo

布局:
  标题: "需关注的应用 / 云服务"（无icon）
  右侧: 严重N(红badge) 警告N(橙badge)
  网格: 8列 @ >1200px / 4列 @ 768-1200px / 2列 @ <768px

卡片结构:
  head: 名称(13px粗体) + 类型标签(10px灰底)
  main: 分数(14px粗体) + 状态文字(11px)  ← margin-top: 8px
  faults: 故障标签(10px红底)

状态颜色:
  critical → 红色 (#F5222D)
  warning  → 橙色 (#FF7D00)
  normal   → 绿色 (#07C160)
```

### 5.6 Row 5: 自动修复记录 · 近7天

**AiopsHealingRecords 组件**

```
Props:
  records: Array<{ id, time, alert, resource, action, result, duration, incidentId }>

Events:
  record-click(record) → /ops/incident/:incidentId?tab=postmortem

布局:
  标题: "自动修复记录 · 近7天"（无icon）
  右侧: "查看全部 →" 链接 → /ops/incidents/config/records

记录结构:
  左: ✓/✗ 状态图标(成功绿/失败红)
  中: 资源名(12px蓝粗体) + 操作标签(11px蓝底) + 时间(11px灰)
  下: 详情文字(11px灰)
  右: > 箭头
```

### 5.7 关联告警 Drawer

```
触发: 点击表格「关联告警」列蓝色数字
宽度: Math.min(window.innerWidth * 0.9, 1200)  ← 响应式 + resize监听
位置: 右侧

内容:
  标题: incident_no
  表格: 7列（级别/告警名称/资源/状态/触发时间/操作/查看详情）

表格列定义:
  { title: '级别',     key: 'level',       width: 60  }
  { title: '告警名称', dataIndex: 'title',   ellipsis: true }
  { title: '资源',     dataIndex: 'resource', width: 100, ellipsis: true }
  { title: '状态',     key: 'status',       width: 60  }
  { title: '触发时间', dataIndex: 'trigger_time', width: 120 }
  { title: '操作',     key: 'action',       width: 60  }
  { title: '查看详情', key: 'detail',       width: 70  }

操作列: "AI分析" → /ops/incident/:incident_id
查看详情列: "查看详情" → /alarm/current?alertId=:alert_id
底部按钮: "查看告警根因" → /ops/incident/:incident_no
```

---

## 六、AlarmDetailView.vue 完整规格

### 6.1 页面布局

```
┌──────────────────────────────────────────────────────┐
│ Header: ← 智能告警分析                               │
│   INC-2026-0823-01  P1紧急  AI自动聚合  进行中        │
│                           [在AI助手继续分析] [一键自愈]│
├──────────────────────────────────────────────────────┤
│ Tabs: [故障分析] [复盘沉淀]                           │
├──────────────────────────────────────────────────────┤
│ Layout: grid 1fr 280px                               │
│ ┌─────────────────────────┬──────────────┐           │
│ │ Left 70%                │ Right 28%    │           │
│ │ ┌─────────┬───────────┐ │ ┌──────────┐ │           │
│ │ │RCA根因  │ 告警时间线 │ │ │AI处置建议│ │           │
│ │ │分析     │           │ │ │          │ │           │
│ │ └─────────┴───────────┘ │ ├──────────┤ │           │
│ │ ┌─────────────────────┐ │ │关联指标  │ │           │
│ │ │ 原始告警明细(table)  │ │ │          │ │           │
│ │ └─────────────────────┘ │ ├──────────┤ │           │
│ │ ┌─────────────────────┐ │ │跳转链接  │ │           │
│ │ │ AI分析结论           │ │ │          │ │           │
│ │ └─────────────────────┘ │ └──────────┘ │           │
│ └─────────────────────────┴──────────────┘           │
└──────────────────────────────────────────────────────┘
```

### 6.2 路由与返回

- 路由: `/alarm-analysis/:id`
- 返回按钮: `goBack()` → `/overview?tab=alarm`

### 6.3 右侧面板

| 区块 | 内容 |
|---|---|
| AI处置建议 | 编号步骤列表 + 一键自愈按钮(容量类) + 在AI助手中继续分析 |
| 关联指标 | 分类进度条（容量类蓝/阈值类橙/证书类紫/网络类青/服务类红/硬件类粉） |
| 跳转链接 | 关联仪表盘→`/monitor/dashboard` / 相关日志→`/ops/logs/runtime/query` / 主机详情→`/monitor/resource` |

---

## 七、CSS 规格

### 7.1 全局布局

```css
.alarm-analysis-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: calc(100vh - 48px);  /* 导航栏48px */
  overflow-y: auto;
}
```

### 7.2 Hero 行

```css
.aa-hero-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.aa-hero-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
.aa-hero-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.aa-hero-val { font-size: 24px; font-weight: 700; color: #1A1A1A; }
.aa-hero-label { font-size: 13px; color: #595959; }
.aa-hero-sub { font-size: 11px; color: #8C8C8C; }
.aa-hero-trend { font-size: 11px; color: #52C41A; text-align: right; }
```

### 7.3 图表行

```css
.aa-chart-row { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 12px; }
.aa-chart-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; }
.aa-chart-title { font-size: 13px; font-weight: 600; color: #1A1A1A; }
.aa-chart-inner { height: 180px; }
```

### 7.4 表格行

```css
.aa-table-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 10px; padding: 14px; }
.aa-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.aa-table-title { font-size: 14px; font-weight: 600; color: #1A1A1A; }
.aa-table-actions { display: flex; align-items: center; gap: 8px; }
.aa-root-cause-link { color: #007DFF; cursor: pointer; }
.aa-related-link { color: #007DFF; cursor: pointer; font-weight: 500; }
.aa-table-link { font-size: 12px; color: #007DFF; cursor: pointer; }
.action-text-links { display: flex; gap: 10px; }
```

### 7.5 移动端断点

```css
@media (max-width: 1200px) {
  .aa-hero-row { grid-template-columns: repeat(2, 1fr); }
  .aa-chart-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .aa-hero-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .aa-chart-row { grid-template-columns: 1fr; }
  .aa-table-header { flex-direction: column; align-items: stretch; gap: 8px; }
}
@media (max-width: 480px) {
  .aa-hero-row { grid-template-columns: 1fr; }
}
```

---

## 八、数据流

```
页面加载
  │
  ├─ fetch('/api/alarm/overview-stats')
  │   ├─ → heroStats (4个数字)
  │   ├─ → categoryStats (分类数组)
  │   ├─ → funnelData (漏斗4步)
  │   └─ → healingRecords (修复记录数组)
  │
  ├─ fetch('/api/alarm/incidents')
  │   └─ → alarmIncidents (事件数组, 含 related_alerts)
  │       ├─ 聚合 → alarmApps (应用卡片, 从 related_alerts 提取)
  │       └─ 聚合 → alarmAppCounts (critical/warning 计数)
  │
  └─ nextTick → 渲染3个G2图表

用户交互
  │
  ├─ 点击根因摘要 → /ops/incident/:id (SRE故障中心)
  ├─ 点击关联告警数字 → 打开 drawer (显示原始告警表格)
  ├─ 点击故障自愈 → Mock: status改为resolved
  ├─ 点击AI分析 → /ops/incident/:id
  ├─ 点击查看详情 → /ops/incident/:id
  ├─ 点击应用卡片 → /ops/incident/:incidentNo
  ├─ 点击修复记录 → /ops/incident/:incidentId?tab=postmortem
  ├─ drawer内AI分析 → /ops/incident/:incident_id
  ├─ drawer内查看详情 → /alarm/current?alertId=:alert_id
  └─ drawer底部查看告警根因 → /ops/incident/:incident_no
```

---

## 九、关键经验教训

### G2 v5 图表

1. **transpose 强制旋转文字**：`coordinate({ transform: [{ type: 'transpose' }] })` 会将分类轴文字竖排，`autoRotate: false` 无法阻止。解决方案：数据归一化到 0-100 使标签变短。
2. **轴标题应全部移除**：`title: false` 减少视觉噪音。
3. **Chart 容器必须显式设高度**：`autoFit: true` 只控制宽度，高度需 CSS 设置。
4. **G2 渲染到 Canvas**：测试时用 `canvas.width` / `getImageData()` 而非 `querySelector('svg')`。

### 组件样式穿透

5. **`<style scoped>` 不穿透子组件**：子组件需自行定义 `.aa-table-header` 的 flex 布局样式。

### 路由设计

6. **首页 Tab 嵌入**：告警分析作为 HomeView 的 `homeTab='alarm'` 状态，URL 表达为 `/overview?tab=alarm`。
7. **旧链接兼容**：`/alarm-analysis` → redirect 到 `/overview?tab=alarm`。
8. **详情页独立路由**：`/alarm-analysis/:id` 保持独立，不嵌入 HomeView。

### 测试

9. **Playwright mock API**：`page.route()` 拦截返回固定数据，确保确定性断言。
10. **G2 Canvas 测试**：扫描像素判断文字方向（horizontal vs vertical pixels）。

---

## 十、还原步骤

1. 复制 `src/views/alarm/AlarmAnalysisView.vue`
2. 复制 `src/views/alarm/AlarmDetailView.vue`
3. 复制 `src/components/aiops/AiopsAppCards.vue`
4. 复制 `src/components/aiops/AiopsHealingRecords.vue`
5. 复制 `server/server.js` 中 L2090-2216 的 3 个 API 端点
6. 在 `src/router/index.js` 添加 5 条路由
7. 在 `src/App.vue` 修改导航高亮规则（首页包含 `/alarm-analysis*`）
8. 在 `src/views/HomeView.vue` 修改 `homeTab` 默认值为 `'alarm'`
9. 安装依赖 `@antv/g2`（如未安装）
10. 运行 `npm run build` 验证无报错
