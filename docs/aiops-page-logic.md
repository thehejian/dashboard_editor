# AI 运维页面逻辑文档

> 文件：`src/views/HomeView.vue`  
> 后端：`server/server.js`  
> 路由：`/aiops` → `EmptyRoute.vue` → `App.vue` 渲染 `HomeView`

---

## 页面结构总览

```
┌─────────────────────────────────────────────┐
│  Tab 导航栏（AI运维 | 概览）                  │
├─────────────────────────────────────────────┤
│  AI 输入栏（订单服务为什么告警？）              │
├─────────────────────────────────────────────┤
│  KPI 行（4 卡片）                             │
├─────────────────────────────────────────────┤
│  需关注的应用 / 云服务（热力图，默认仅异常）     │
│  ┌─────────────────────────────────────┐     │
│  │ 8 列网格，点击 → 打开应用故障抽屉     │     │
│  └─────────────────────────────────────┘     │
├─────────────────────────────────────────────┤
│  智能诊断与自动修复                            │
│  ┌──────────────────────┬────────────────┐   │
│  │ 当前异常（70% 表格）   │ 未来30min预测  │   │
│  │ 严重/警告 tab 切换     │ 可点击进抽屉   │   │
│  │ 点击行 → 抽屉          │               │   │
│  ├──────────────────────┴────────────────┤   │
│  │ 自动修复记录（3列网格，可点击进抽屉）    │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 数据来源（7 个 API）

| API | 用途 | 数据 |
|---|---|---|
| `/api/intelligent/anomalies` | 异常检测 | 8 条 mock 异常（含 nodeId, score, level, evidence） |
| `/api/intelligent/health` | 应用健康度 | 87 分 + 24 个应用/云服务（含 status, score, nodes[], history[]） |
| `/api/intelligent/predictions` | 未来预测 | 3 条预测（含 time, eta, confidence） |
| `/api/intelligent/remediation` | 自动修复 | rate + 3 条修复记录（含 result, action） |
| `/api/mock/topology` | 拓扑 | 22 节点 + 28 条边 + 10 条事件时间轴 |
| `/api/intelligent/recommendations` | 推荐操作 | 8 条建议（含 action, priority, confidence） |
| `/api/intelligent/golden-signals` | 黄金信号 | 6 节点信号（latency, traffic, errors），支持 nodeId 查询 |

---

## 核心状态

```javascript
// 应用相关
aiopsApps          // 24 个应用（原始列表）
appFilter          // 'abnormal'（默认）或 'all'
visibleApps        // 过滤后的应用（异常 or 全部）
abnormalAppCounts  // { critical: N, warning: N }

// 故障节点相关
faultNodes         // 从 anomalies 提取的故障节点（去重、排序，根因置顶）
activeFaultNode    // 当前选中的故障节点 tab

// 抽屉相关
activeApp          // 当前打开的应用对象
appDrawerOpen      // 抽屉开关
activeAppFaultNodes // 该应用的故障节点列表
activeAppAnomalies // 该应用的所有异常
activeAppIsRoot    // 是否根因应用
activeAppSevereAnomaly // 该应用最严重异常
activeAppDuration  // 影响时长
activeAppTrend     // 健康分趋势
activeAppSummaryText // 智能摘要文本

// 异常列表
aiopsAnomalies     // 全部异常
anomalyFilter      // 'all' | 'critical' | 'warning'
filteredAnomalies  // 过滤后的异常

// 黄金信号
aiopsGoldenSignalsByNode  // { [nodeId]: signals[] }

// 其他
aiopsRootCause     // 根因异常（score 最高者）
aiopsPropagationPath // 传播路径
```

---

## 热力图逻辑

**数据流：**
```
aiopsApps (24) → appFilter 控制 → visibleApps (8 异常 / 24 全部) → 渲染网格
```

**状态规则：**
- 24 个应用，每个含 `status`（critical/warning/normal）
- 默认 `appFilter = 'abnormal'`，只显示 8 个异常应用
- toggle「仅异常 / 全部」切换

**点击卡片 → 打开抽屉：**
```javascript
openAppDrawer(app) {
  activeApp = app
  activeFaultNode = root 节点（如果属于该应用）否则 nodes[0]
  appDrawerOpen = true
}
```

---

## 异常与智能区块

### 左侧 70%：当前异常表格

| 列 | 数据 | 可点 |
|---|---|---|
| 异常指标 | metric | — |
| 节点 | nodeLabel（链接色） | — |
| 级别 | level 标签（严重/警告/提示） | — |
| 当前值 | currentValue + 单位 | — |
| 得分 | score 进度条 | — |
| 时间 | time.slice(11) | — |

**筛选：** radio-group 切换 `anomalyFilter`（all/critical/warning），表格即时过滤  
**点击行：** `openAppFromNode(nodeId)` → 找到应用 → 打开抽屉 → 激活该节点 tab

### 右侧 30%：未来30分钟预测

- 数据按 `time` 倒序排列
- 每项显示：节点名（链接色）、指标 → 预测值、进度条、ETA、置信度
- 点击 → 打开对应应用抽屉

### 底部全宽：自动修复记录

- 3 列网格（移动端 1 列）
- 每项显示：成功/失败图标、节点名（链接色）、动作、时间、详情
- 点击 → 打开对应应用抽屉

---

## 应用故障抽屉（80% 宽度）

### 总结区（三栏网格）

```
┌──────────┬─────────────────────────────────┐
│ 大号分数  │ 根因：CPU使用率      异常数：5条  │
│ 状态pill │ 严重指标：CPU 97%   影响时长：13分 │
├──────────┴─────────────────────────────────┤
│ 趋势sparkline + ↓↑差值     严重1 警告2 正常0 │
└────────────────────────────────────────────┘
┌───────────────────────────────────────────┐
│ 智能摘要横幅（仅根因应用显示）               │
│ 订单服务-01 CPU使用率 97，偏离基线 115%，建议…│
└───────────────────────────────────────────┘
```

**左侧**：健康分（38px）+ 状态色 pill  
**右侧**：2×2 图标 meta 卡（根因/异常数/严重指标/影响时长）  
**底部**：趋势 sparkline + 故障分布角标  
**边框**：`border-left: 4px` 状态色（红/橙/绿）  
**智能摘要**：仅根因应用显示，紫色渐变底 + 左色条

### 故障节点 Tab

- a-tabs 切换，根因节点显示红色「根因」badge
- 每个 tab 内容独立（黄金信号、异常时间线、根因分析、推荐操作）

### 黄金信号（3 指标）

延迟 / 流量 / 错误率，各含：
- 当前值 + 单位
- 基线对比
- 偏离度（>100% 红色，否则橙色）
- sparkbar 历史趋势

### 三栏详情区

| 栏 | 内容 |
|---|---|
| 异常时间线 | 时间轴节点（红/橙/蓝点 + 标签 + 指标 + 得分进度条） |
| 根因分析 | 根因节点、指标、得分进度条、传播路径箭头流、证据详情（可展开） |
| AI推荐操作 | 优先级标签 + 执行按钮 + 置信度 |

---

## 侧滑面板切换逻辑

页面有两个侧滑面板，互斥：

1. **告警详情面板**（`detailPanelOpen`）— 从顶部 KPI 卡片点击打开
2. **应用故障抽屉**（`appDrawerOpen`）— 从热力图/异常表格/预测/修复记录点击打开

```javascript
// 打开抽屉时，告警面板关闭
function openAppDrawer(app) {
  detailPanelOpen = false  // 确保互斥
  appDrawerOpen = true
}
```

---

## 关键交互

| 交互 | 触发 | 行为 |
|---|---|---|
| 切换异常筛选 tab | radio-group | 表格行数变化 |
| 点击异常表格行 | table row click | 打开应用抽屉 + 定位故障节点 |
| 点击预测项 | div click | 打开应用抽屉 |
| 点击修复记录 | div click | 打开应用抽屉 |
| 点击热力图卡片 | app-card click | 打开应用抽屉 |
| 点击抽屉关闭 | close-btn | 关闭抽屉，筛选保持 |
| 点击黄金信号 | gs-card click | 无操作 |
| 点击推荐操作执行按钮 | rec-item button | AI 助手调用 |
| 点击证据详情展开 | rc-evidence-toggle | 展开/收起 |
| 热力图 toggle | 仅异常/全部 | 切换显示 8/24 卡片 |
| KPI 卡片点击 | kpi-card click | 打开告警详情面板 |

---

## 筛选持久性

- `anomalyFilter` 和 `appFilter` 是组件内 ref
- 打开/关闭抽屉**不重置**筛选（同一组件内，ref 持续存在）
- 切换路由（离开 AI 运维页面）会重置为默认值（组件卸载）

---

## 响应式断点

| 宽度 | 热力图 | 修复记录 |
|---|---|---|
| > 768px | 8 列 | 3 列 |
| ≤ 768px | 4 列 | 1 列 |
| ≤ 480px | 4 列 | 1 列 |
