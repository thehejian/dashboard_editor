# 2026-08-24 下午变更记录（故障名称修正 + 图表优化 + Drawer修复）

> 本次变更基于已完成的告警分析页面（参见 `alarm-analysis-changelog.md`）。  
> 时间范围：2026-08-24 14:00 之后的所有修改。  
> 涉及 6 个文件，共 24 行新增、14 行删除。

---

## 一、变更总览

| # | 变更 | 文件 | 影响 |
|---|---|---|---|
| 1 | 表格列重命名+换序 | `AlarmAnalysisView.vue` | 列名：事件ID→故障ID，根因摘要→故障名称，顺序互换 |
| 2 | 后端取 MOCK_INCIDENTS.title | `server/server.js` | 故障名称用业务标题，不用原始告警标题 |
| 3 | 过滤 UNLINKED 告警 | `server/server.js` | 表格只显示有 SRE 故障中心对应的记录 |
| 4 | 详情页显示故障名称 | `AlarmDetailView.vue` | header 区新增一行蓝色故障名称 |
| 5 | 搜索增加故障ID | `AlarmAnalysisView.vue` | 搜索框支持按 incident_no 搜索 |
| 6 | 图表柱子变细 | `AlarmAnalysisView.vue` | TopN+漏斗图 `encode('size', 16)` |
| 7 | Drawer 关闭按钮靠右 | `App.vue` | 全局 CSS 修复 Ant Design Drawer 关闭 icon 位置 |
| 8 | 记录后端重启要求 | `AGENTS.md` | 文档补充 |

---

## 二、逐文件修改详情

### 2.1 `server/server.js`（后端 API）

#### 修改1：`/api/alarm/incidents`（L2093-2121）— 取 MOCK_INCIDENTS.title

**目的：** 故障名称列应显示业务影响描述（如"购物车核心交易链路数据库连接耗尽"），而非原始告警标题（如"CPU使用率超过90%"）。

**改前：**
```js
const key = a.incident_id || 'UNLINKED-' + a.id
if (!groupMap[key]) {
  groupMap[key] = {
    incident_no: key,
    title: a.title,           // ← 直接用告警标题
    root_cause: a.title,      // ← 同上
```

**改后：**
```js
const key = a.incident_id || 'UNLINKED-' + a.id
const sreIncident = a.incident_id ? MOCK_INCIDENTS.find(i => i.id === a.incident_id) : null
if (!groupMap[key]) {
  groupMap[key] = {
    incident_no: key,
    title: sreIncident?.title || a.title,        // ← 优先取 MOCK_INCIDENTS
    root_cause: sreIncident?.description || a.title, // ← 取描述
```

#### 修改2：`/api/alarm/incidents`（L2118）— 过滤 UNLINKED

**目的：** 表格只显示能和 SRE 故障中心对应上的数据。无 `incident_id` 的告警（UNLINKED-*）不显示。

**改前：**
```js
const data = Object.values(groupMap)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
```

**改后：**
```js
const data = Object.values(groupMap)
    .filter(g => MOCK_INCIDENTS.some(i => i.id === g.incident_no))  // ← 新增
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
```

#### 修改3：`/api/alarm/incidents/:id`（L2145）— 取 MOCK_INCIDENTS.title

**改前：**
```js
title: firstAlert.title,
```

**改后：**
```js
title: sreIncident?.title || firstAlert.title,
```

#### ⚠️ 踩坑：修改后端后必须重启

后端 Express 没有热更新，修改 `server/server.js` 后必须重启：

```bash
lsof -i :3001 -t | xargs kill -9
nohup node server/server.js > /tmp/server.log 2>&1 &
```

前端 Vite 有 HMR 自动热更新，后端没有。不重启则改动不生效，页面显示的还是旧数据。

---

### 2.2 `src/views/alarm/AlarmAnalysisView.vue`（告警分析主页面）

#### 修改1：表格列重命名+换序（L212-221）

**改前：**
```js
const alarmIncidentColumns = [
  { title: '事件ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true },
  { title: '根因摘要', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
  // ...
]
```

**改后：**
```js
const alarmIncidentColumns = [
  { title: '故障名称', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },       // ← 第一列
  { title: '故障ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true }, // ← 第二列
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
  // ...
]
```

**要点：**
- 故障名称（`dataIndex: 'title'`）是蓝链接，点击跳转 `/ops/incident/:id`
- 故障ID（`dataIndex: 'incident_no'`）是纯文字
- 模板中 `column.key === 'title'` 的渲染逻辑不需要改（key 没变）

#### 修改2：搜索框 placeholder（L70）

```html
<!-- 改前 -->
<a-input-search placeholder="搜索事件、根因" ... />
<!-- 改后 -->
<a-input-search placeholder="搜索故障名称、ID" ... />
```

#### 修改3：搜索逻辑增加 incident_no（L322）

**改前：**
```js
list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
```

**改后：**
```js
list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.incident_no || '').toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
```

#### 修改4：TopN 图表柱子变细（L275）

**改前：**
```js
topnChart.interval().encode('x', 'category').encode('y', 'pct')
```

**改后：**
```js
topnChart.interval().encode('x', 'category').encode('y', 'pct').encode('size', 16)
```

#### 修改5：漏斗图柱子变细（L294）

**改前：**
```js
funnelChart.interval().encode('x', 'step').encode('y', 'count')
```

**改后：**
```js
funnelChart.interval().encode('x', 'step').encode('y', 'count').encode('size', 16)
```

#### ⚠️ 踩坑：G2 v5 控制柱子粗细

- **错误方式：** `style('maxHeight', 20)` — 对 transposed 图表不精确，实际柱子高度偏差大
- **正确方式：** `encode('size', 16)` — 精确控制柱子厚度（单位 px）
- `size` 值越小柱子越细，16 约为行高的 50-60%，视觉效果较好
- 该属性对 `interval()` + `coordinate({ transform: [{ type: 'transpose' }] })` 的横向条形图有效

---

### 2.3 `src/views/alarm/AlarmDetailView.vue`（故障详情页）

#### 修改：header 区增加故障名称（L9, L276）

**改前：**
```html
<div class="aa-header-info">
  <h1 class="aa-title">智能告警分析</h1>
  <div class="aa-subtitle">
    <span class="aa-incident-no">{{ incident?.incident_no }}</span>
```

**改后：**
```html
<div class="aa-header-info">
  <h1 class="aa-title">智能告警分析</h1>
  <div class="aa-fault-name">{{ incident?.title }}</div>    <!-- ← 新增 -->
  <div class="aa-subtitle">
    <span class="aa-incident-no">{{ incident?.incident_no }}</span>
```

**新增 CSS（L276）：**
```css
.aa-fault-name { font-size: 14px; font-weight: 600; color: #007DFF; margin: 2px 0; }
```

#### ⚠️ 踩坑：详情页标题一致性

列表页的"故障名称"列和详情页的故障名称必须显示同一个值。数据来源链路：
```
列表页: /api/alarm/incidents → MOCK_INCIDENTS.title → 表格 column "故障名称"
详情页: /ops/incident/:id → /api/sre/incidents/:id → MOCK_INCIDENTS.title → incident.title
```

两者都从 `MOCK_INCIDENTS.title` 取值，所以一致。如果只改了一边，会出现列表和详情显示不同名称的问题。

---

### 2.4 `src/App.vue`（全局样式）

#### 修改：Ant Design Drawer 关闭按钮靠右（L438-440）

**问题：** Ant Design Vue 的 `<a-drawer>` 组件关闭按钮（X icon）默认在标题左侧，不在右侧。

**DOM 结构分析：**
```
.ant-drawer-header (display:flex)
  .ant-drawer-header-title (display:flex)
    .ant-drawer-close        ← 关闭按钮，是 header-title 的第一个子元素
    .ant-drawer-title        ← 标题文字，是第二个子元素
```

**修复方案：**
```css
/* Ant Design Drawer 关闭按钮靠右 */
.ant-drawer-header { display: flex !important; justify-content: flex-end !important; }
.ant-drawer-header-title { display: flex !important; justify-content: flex-end !important; width: 100% !important; }
.ant-drawer-close { order: 99 !important; margin-left: auto !important; }
```

**原理：**
1. `header-title` 设为 `flex-end` + `width: 100%`，让标题文字占满宽度
2. `close` 按钮设 `order: 99` 强制排到最后，`margin-left: auto` 推到最右

#### ⚠️ 踩坑：Ant Design Drawer CSS 优先级

- 必须用 `!important`，因为 Ant Design 的 CSS 优先级较高
- 只改 `.ant-drawer-header` 的 `justify-content` 不够，因为 close btn 在 `header-title` 内部
- 必须同时改 `header-title` 和 `close` 两个层级
- 该修复影响所有 `<a-drawer>` 组件（全局生效），涉及 6 处 drawer 用法

---

### 2.5 `tests/alarm-analysis.spec.js`（测试）

#### 修改1：列名断言（L143-153）

```js
// 改前
test('Row3: 表格列包含事件ID、根因摘要、级别...', async ({ page }) => {
  expect(joined).toContain('事件ID')
  expect(joined).toContain('根因摘要')

// 改后
test('Row3: 表格列包含故障名称、故障ID、级别...', async ({ page }) => {
  expect(joined).toContain('故障名称')
  expect(joined).toContain('故障ID')
```

#### 修改2：测试名更新（L197）

```js
// 改前
test('根因摘要是蓝色链接，点击跳转到故障详情', ...
// 改后
test('故障名称是蓝色链接，点击跳转到故障详情', ...
```

#### ⚠️ 踩坑：测试中的列名必须与实际列名一致

Playwright 测试通过 `.ant-table-thead th` 获取表头文字，断言 `toContain('故障名称')`。如果改了列名但没改测试，测试会失败。错误信息：
```
Expected substring: "故障名称"
Received string: "事件ID 根因摘要 ..."
```

---

### 2.6 `AGENTS.md`（文档）

新增一行（L15-16）：

```markdown
**修改后端数据/mock/API 后必须重启后端**：`lsof -i :3001 -t | xargs kill -9` →
重新 `nohup node server/server.js`，否则改动不生效。前端 Vite 有 HMR 自动热更新，后端没有。
```

---

## 三、数据流变更

```
改前：
  alerts表 → 按incident_id分组 → title = alert.title（原始告警标题）
                                → 包含 UNLINKED 条目

改后：
  alerts表 → 按incident_id分组 → title = MOCK_INCIDENTS.title（故障名称）
                                → 过滤掉 UNLINKED 条目
                                → 只保留 linked 的 5 条故障
```

**过滤后的 5 条故障：**

| 故障名称 | 故障ID | 关联告警数 | MOCK_INCIDENTS 对应 |
|---|---|---|---|
| 购物车核心交易链路数据库连接耗尽 | INC-2026-0720 | 4 | alert#1,3,4,5 |
| 库存服务扣减接口超时告警 | INC-2026-0722 | 1 | alert#6 |
| 用户服务登录鉴权超时 | INC-2026-0718 | 1 | alert#7 |
| 支付回调链路 MQ 消息堆积 | INC-2026-0715 | 1 | alert#9 |
| 消息网关 WebSocket 连接数异常飙升 | INC-2026-0719 | 1 | alert#10 |

**被过滤掉的 UNLINKED 条目：**
- alert#2: 磁盘空间不足（incident_id=null）
- alert#8: 证书即将过期（incident_id=null）
- alert#11: 网络丢包率过高（incident_id=null）
- alert#12: NTP同步偏移过大（incident_id=null）

---

## 四、关键踩坑清单

| # | 坑 | 表现 | 解决 |
|---|---|---|---|
| 1 | 后端改了没重启 | 页面显示旧数据（原始告警标题） | `lsof -i :3001 -t \| xargs kill -9` 后重启 |
| 2 | G2 v5 `style('maxHeight')` 不精确 | 柱子高度偏差大 | 用 `encode('size', 16)` |
| 3 | Drawer 关闭 icon 在左侧 | Ant Design 默认行为 | 全局 CSS 覆盖 `header`/`header-title`/`close` |
| 4 | CSS 优先级不够 | Drawer close 位置没变 | 必须用 `!important` |
| 5 | 列名改了没改测试 | Playwright 断言失败 | 同步更新 `tests/alarm-analysis.spec.js` |
| 6 | 详情页和列表页标题不一致 | 数据来源不同导致 | 两端都从 MOCK_INCIDENTS.title 取值 |
| 7 | 搜索框不搜故障ID | 用户输入 INC-xxx 搜不到 | 搜索逻辑加 `incident_no` 匹配 |

---

## 附录A：上一次会话（8/21-8/24 下午）的后台变动与注意要点

> 上一次会话从零搭建了告警分析页面的后端 API，以下是对这些 API 的完整说明。  
> 这些 API 在 8/24 下午的会话中被进一步修改（见第二节），两者是叠加关系。

### A.1 三个 API 端点总览

| 端点 | 行号 | 用途 | 调用方 |
|---|---|---|---|
| `GET /api/alarm/incidents` | L2093-2122 | 告警聚合事件列表（主表格） | AlarmAnalysisView |
| `GET /api/alarm/incidents/:id` | L2125-2169 | 单个 Incident 完整分析数据（详情页） | AlarmDetailView |
| `GET /api/alarm/overview-stats` | L2172-2218 | Hero Metric 概览数据（图表+自愈记录） | AlarmAnalysisView |

### A.2 数据源：alerts 表与 MOCK_INCIDENTS

**`server/db/mockData.js` 中的 alerts 表**（告警原始数据）：

```js
// alerts = getTable('alerts')  — PostgreSQL 白名单表，通过 getTable() 读取
// 每条 alert 的关键字段：
{
  id: 'alert#1',
  title: 'CPU使用率超过90%',           // 原始告警标题
  level: 'critical',                    // critical / warning
  status: 'firing',                     // firing / resolved / suppressed
  resource: 'payment-service',          // 告警资源
  category: '容量类',                    // 告警分类
  trigger_time: '2026-06-17T09:10:00Z', // 触发时间
  incident_id: 'INC-2026-0720',         // ← 关键！关联到 MOCK_INCIDENTS
  suggestion: '建议扩容...',             // AI 建议
}
```

**`MOCK_INCIDENTS`**（SRE 故障中心 mock 数据，硬编码在 `server.js` 中）：

```js
const MOCK_INCIDENTS = [
  { id: 'INC-2026-0720', title: '购物车核心交易链路数据库连接耗尽', description: '...', status: 'investigating', ... },
  { id: 'INC-2026-0722', title: '库存服务扣减接口超时告警', ... },
  { id: 'INC-2026-0718', title: '用户服务登录鉴权超时', ... },
  { id: 'INC-2026-0715', title: '支付回调链路 MQ 消息堆积', ... },
  { id: 'INC-2026-0719', title: '消息网关 WebSocket 连接数异常飙升', ... },
]
```

### A.3 聚合逻辑（`/api/alarm/incidents`）

```
alerts 表
  ↓ 按 incident_id 分组
  ↓ incident_id 有值 → MOCK_INCIDENTS.find(i => i.id === incident_id)
  ↓ incident_id 无值 → key = 'UNLINKED-' + alert.id
  ↓ 过滤：只保留 MOCK_INCIDENTS 中存在的 key
  ↓ 排序：created_at 倒序
  → 返回 data[]
```

**每条 data 的字段映射：**
```js
{
  incident_no: 'INC-2026-0720',     // key = alert.incident_id
  title: MOCK_INCIDENTS.title,       // ← 8/24 下午改：优先取 MOCK_INCIDENTS
  root_cause: MOCK_INCIDENTS.description, // ← 8/24 下午改
  level: 'critical',                 // 取关联告警中最高级别
  category: '容量类',                 // 取第一条告警的分类
  status: 'investigating',           // firing → investigating
  affected_count: 4,                 // 关联告警数
  handler: 'ai',                     // 有 incident_id → 'ai'，否则 'manual'
  related_alerts: [alert1, alert2, ...], // 关联的原始告警列表
}
```

### A.4 详情接口（`/api/alarm/incidents/:id`）

**URL 参数：** `:id` = `incident_no`（如 `INC-2026-0720`）

**匹配逻辑：**
```js
const relatedAlerts = alerts.filter(a => a.incident_id === incId || String(a.id) === incId)
// 先按 incident_id 匹配，再按 alert id 匹配（兼容两种情况）
```

**返回结构：**
```js
{
  incident: {
    incident_no: 'INC-2026-0720',
    title: MOCK_INCIDENTS.title,        // ← 8/24 下午改：优先取 MOCK_INCIDENTS
    root_cause: MOCK_INCIDENTS.description,
    level: 'critical',
    severity: 'P1',                      // 有 critical → P1，否则 P2
    category: '容量类',
    status: 'investigating',
    affected_count: 4,
    handler: 'ai',
    evidence: MOCK_INCIDENTS.timeline,   // 时间线证据
    ai_confidence: 87,                   // 有 MOCK_INCIDENTS → 87，否则 72
    suggestions: ['检查相关服务状态', '查看应用日志定位异常', '必要时执行回滚'],
    can_heal: true,                      // category === '容量类'
  },
  relatedAlerts: [...],                  // 原始告警列表
  categoryBreakdown: [{ category: '容量类', count: 2 }], // 分类统计
}
```

### A.5 概览统计（`/api/alarm/overview-stats`）

**返回结构：**
```js
{
  heroStats: {
    closedCount: 3452,       // 硬编码 + resolved 告警数
    reductionRate: 91.5,     // 硬编码
    autoRate: 78.3,          // 硬编码
    savedHours: 280,         // 硬编码
  },
  categoryStats: [{ category: '容量类', count: 3, pct: 50 }, ...], // 动态计算
  funnelData: { raw: 100000, dedup: 85000, agg: 8500, rate: 91.5 }, // 硬编码
  trendData: { labels: [...], aiClosed: [...], manualClosed: [...] }, // 硬编码
  healingRecords: [...],   // 硬编码 4 条自愈记录
}
```

### A.6 上一次会话的踩坑要点

| # | 坑 | 详情 |
|---|---|---|
| 1 | **`MOCK_INCIDENTS` 位置** | 硬编码在 `server.js` 中（约 L2070-2090），不在 `mockData.js`。因为它是临时 mock，非正式数据源 |
| 2 | **`getTable('alerts')` 读的是 PostgreSQL** | `alerts` 是白名单表（见 `server/routes/cmdb.js`），不是前端 mock。如果 PostgreSQL 中 alerts 表为空，API 返回空数组 |
| 3 | **`incident_id` 是关联键** | alerts 表中的 `incident_id` 字段必须和 `MOCK_INCIDENTS.id` 完全匹配。如果改了任一侧的 ID，关联会断 |
| 4 | **UNLINKED 逻辑** | 无 `incident_id` 的告警生成 `UNLINKED-{alert.id}` 作为 key，8/24 下午被过滤掉了。如果需要显示所有告警，移除 `.filter()` |
| 5 | **`handler` 字段** | `incident_id` 有值 → `'ai'`，无值 → `'manual'`。前端用来区分"AI 分析"和"人工处理"的标签颜色 |
| 6 | **`can_heal` 逻辑** | 只有 `category === '容量类'` 才返回 `true`。前端用来决定是否显示"故障自愈"按钮 |
| 7 | **`ai_confidence` 硬编码** | 有 MOCK_INCIDENTS → 87，无 → 72。纯展示用，不影响逻辑 |
| 8 | **重启后端** | 修改 `server.js` 后必须重启：`lsof -i :3001 -t \| xargs kill -9` → `nohup node server/server.js &`。前端 Vite HMR 自动热更新，后端没有 |

---

## 六、还原步骤

1. `server/server.js` — 3 处修改（L2098, L2118, L2145）
2. `src/views/alarm/AlarmAnalysisView.vue` — 5 处修改（L70, L213-214, L275, L294, L322）
3. `src/views/alarm/AlarmDetailView.vue` — 2 处修改（L9, L276）
4. `src/App.vue` — 1 处新增（L438-440）
5. `tests/alarm-analysis.spec.js` — 2 处修改（L143-153, L197）
6. `AGENTS.md` — 1 处新增（L15-16）
7. 重启后端：`lsof -i :3001 -t | xargs kill -9 && nohup node server/server.js &`
8. 运行测试：`npx playwright test tests/alarm-analysis.spec.js`（28 passed）

---

## 附录B：完整还原参考数据

> 以下数据供从零搭建或迁移到其他页面时参考。所有 mock 数据均硬编码在 `server/server.js` 和 `server/db/mockData.js` 中。

### B.1 路由配置（`src/router/index.js`）

```js
// L7: 重定向 — 旧路径自动跳转
{ path: '/alarm-analysis', redirect: '/overview?tab=alarm' },

// L8: 详情页 — 独立路由，不嵌套
{ path: '/alarm-analysis/:id', name: 'alarm-analysis-detail', component: () => import('../views/alarm/AlarmDetailView.vue') },
```

**要点：**
- `/alarm-analysis` 重定向到 `/overview?tab=alarm`（首页 tab 模式）
- `/alarm-analysis/:id` 是独立路由，`AlarmDetailView.vue` 单独渲染（不在 HomeView 内）
- `:id` = `incident_no`（如 `INC-2026-0720`），详情页通过 `route.params.id` 取值

### B.2 App.vue 导航高亮规则（L7, L11）

```js
// L7: 首页 tab — 覆盖 /、/overview、/aiops、/alarm-analysis*
{
  path: '/' || path === '/overview' || path === '/aiops' || path.startsWith('/alarm-analysis')
}

// L11: 告警 tab — 覆盖 /alarm* 但排除 /alarm-analysis*
{
  path.startsWith('/alarm') && !path.startsWith('/alarm-analysis')
}
```

**要点：**
- `/alarm-analysis` 和 `/alarm-analysis/:id` 都高亮"首页"菜单
- `/alarm/current`、`/alarm/realtime` 等高亮"告警"菜单
- 如果新页面需要高亮某个菜单，在 App.vue 对应 `nav-item` 的 `:class` 中添加路径判断

### B.3 MOCK_INCIDENTS 完整数据（`server/server.js` L1100-1283）

```js
const MOCK_INCIDENTS = [
  {
    id: 'INC-2026-0720',
    title: '购物车核心交易链路数据库连接耗尽',
    description: '受大促极速加购业务流冲击，微服务实例瞬间耗尽其数据库连接资源，引发全链级联雪崩。',
    status: 'healing',
    severity: 'P1',
    appName: '订单服务',
    appNodeId: 'prod-order-01',
    service: 'cart-service',
    startTime: '2026-07-20 08:58:00',
    endTime: null,
    duration: '12min',
    metrics: {
      p99: { current: 3500, baseline: 20, unit: 'ms', multiplier: '175x 突增' },
      failureRate: { current: 85.4, unit: '%', label: '大量 HTTP 504 熔断' },
      affectedUsers: { current: 2300, label: '受影响用户' },
      affectedSessions: { current: 2500, label: '受影响会话' },
    },
    healingProgress: 15,
    relatedAlertIds: [1, 3, 4, 5],
    topologyNodeIds: ['lb-api', 'prod-order-01', 'redis-cache', 'mysql-master', 'mysql-slave'],
    impactScope: '影响 2 个下游服务: redis-cache(缓存命中率↓45%), mysql-master(连接数↑120%)',
    timeline: [
      { time: '08:58', event: '告警触发', type: 'alert', detail: 'P99 响应时间 3500ms 触发阈值告警' },
      { time: '09:00', event: 'AI 检测', type: 'detection', detail: '根因定位: 数据库连接池耗尽' },
      { time: '09:02', event: '流量隔离', type: 'action', detail: 'cart-service-v1 切至稳定容器组' },
      { time: '09:05', event: '扩容连接池', type: 'action', detail: 'HikariCP 50 → 250' },
      { time: '09:15', event: '指标恢复', type: 'recovery', detail: '错误率 0%, P99 22ms' },
    ],
  },
  {
    id: 'INC-2026-0718',
    title: '用户服务登录鉴权超时',
    description: '用户服务因 Redis 缓存击穿导致大量请求穿透至数据库，登录接口超时率飙升。',
    status: 'resolved',
    severity: 'P2',
    appName: '用户服务',
    appNodeId: 'prod-user-01',
    service: 'user-service',
    startTime: '2026-07-18 10:15:00',
    endTime: '2026-07-18 10:28:00',
    duration: '13min',
    metrics: {
      p99: { current: 2800, baseline: 40, unit: 'ms', multiplier: '70x 突增' },
      failureRate: { current: 62.1, unit: '%', label: '大量 HTTP 503 超时' },
      affectedUsers: { current: 1200, label: '受影响用户' },
      affectedSessions: { current: 1350, label: '受影响会话' },
    },
    healingProgress: 100,
    relatedAlertIds: [7],
    topologyNodeIds: ['lb-api', 'prod-user-01', 'redis-cache', 'mysql-master'],
  },
  {
    id: 'INC-2026-0715',
    title: '支付回调链路 MQ 消息堆积',
    description: '支付回调消息消费线程池耗尽，导致 MQ 队列堆积，回调延迟增大。',
    status: 'resolved',
    severity: 'P2',
    appName: '支付服务',
    appNodeId: 'prod-pay-01',
    service: 'pay-service',
    startTime: '2026-07-15 14:30:00',
    endTime: '2026-07-15 14:45:00',
    duration: '15min',
    metrics: {
      p99: { current: 5200, baseline: 100, unit: 'ms', multiplier: '52x 突增' },
      failureRate: { current: 45.3, unit: '%', label: '回调超时' },
      affectedUsers: { current: 890, label: '受影响用户' },
      affectedSessions: { current: 1020, label: '受影响会话' },
    },
    healingProgress: 100,
    relatedAlertIds: [9],
    topologyNodeIds: ['lb-api', 'prod-pay-01', 'mq-order', 'redis-cache'],
  },
  {
    id: 'INC-2026-0722',
    title: '库存服务扣减接口超时告警',
    description: '库存服务在秒杀场景下扣减接口 P99 显著升高，疑似数据库行锁竞争加剧。',
    status: 'investigating',
    severity: 'P2',
    appName: '库存服务',
    appNodeId: 'prod-inventory-01',
    service: 'inventory-service',
    startTime: '2026-07-22 14:20:00',
    endTime: null,
    duration: '8min',
    metrics: {
      p99: { current: 1800, baseline: 60, unit: 'ms', multiplier: '30x 突增' },
      failureRate: { current: 32.5, unit: '%', label: '扣减请求超时' },
      affectedUsers: { current: 640, label: '受影响用户' },
      affectedSessions: { current: 720, label: '受影响会话' },
    },
    healingProgress: 30,
    relatedAlertIds: [6],
    topologyNodeIds: ['lb-api', 'prod-inventory-01', 'mysql-master', 'mq-order'],
    impactScope: '影响 1 个下游服务: mysql-master(行锁竞争↑)',
    timeline: [
      { time: '14:20', event: '告警触发', type: 'alert', detail: '扣减接口 P99 1800ms 触发阈值告警' },
      { time: '14:22', event: 'AI 检测', type: 'detection', detail: '根因定位: 数据库行锁竞争' },
    ],
  },
  {
    id: 'INC-2026-0719',
    title: '消息网关 WebSocket 连接数异常飙升',
    description: '消息推送网关 WebSocket 长连接数异常增长，疑似客户端重连风暴。',
    status: 'investigating',
    severity: 'P2',
    appName: '消息服务',
    appNodeId: 'prod-user-02',
    service: 'msg-gateway',
    startTime: '2026-07-19 20:05:00',
    endTime: null,
    duration: '20min',
    metrics: {
      p99: { current: 1200, baseline: 80, unit: 'ms', multiplier: '15x 突增' },
      failureRate: { current: 28.4, unit: '%', label: '连接建立失败' },
      affectedUsers: { current: 560, label: '受影响用户' },
      affectedSessions: { current: 580, label: '受影响会话' },
    },
    healingProgress: 50,
    relatedAlertIds: [10],
    topologyNodeIds: ['lb-api', 'prod-user-02', 'redis-cache'],
    impactScope: '影响 1 个下游服务: redis-cache(连接数↑)',
    timeline: [
      { time: '20:05', event: '告警触发', type: 'alert', detail: 'WebSocket 连接数异常飙升' },
      { time: '20:10', event: 'AI 检测', type: 'detection', detail: '根因定位: 客户端重连风暴' },
    ],
  },
  // ⚠️ 以下 2 条无 relatedAlertIds，表格中不显示（被 filter 过滤）
  {
    id: 'INC-2026-0721',
    title: '推荐服务模型推理延迟升高',
    relatedAlertIds: [],  // ← 空，不显示在表格
  },
  {
    id: 'INC-2026-0717',
    title: '日志采集 Agent 批量丢失',
    relatedAlertIds: [],  // ← 空，不显示在表格
  },
]
```

### B.4 alerts 表完整数据（`server/db/mockData.js` L130-143）

```js
alerts: [
  // === 关联到 INC-2026-0720 的 4 条告警 ===
  { id: 1,  level: 'critical', title: 'CPU使用率超过90%',       resource: 'server-001 (华北区域)',   category: '阈值类', incident_id: 'INC-2026-0720', status: 'firing',    trigger_time: '2026-06-17 10:32:00+08' },
  { id: 3,  level: 'critical', title: '数据库主从延迟',         resource: 'db-replica-02 (华东区域)', category: '服务类', incident_id: 'INC-2026-0720', status: 'firing',    trigger_time: '2026-06-17 09:55:00+08' },
  { id: 4,  level: 'warning',  title: '内存使用率偏高',         resource: 'app-server-03 (华南区域)', category: '阈值类', incident_id: 'INC-2026-0720', status: 'firing',    trigger_time: '2026-06-17 10:15:00+08' },
  { id: 5,  level: 'warning',  title: '响应时间超时',           resource: 'api-gateway (华北区域)',   category: '阈值类', incident_id: 'INC-2026-0720', status: 'firing',    trigger_time: '2026-06-17 09:45:00+08' },

  // === 关联到其他 INC 的告警 ===
  { id: 6,  level: 'warning',  title: 'HTTP 5xx错误率上升',    resource: 'nginx-ingress (华北区域)', category: '服务类', incident_id: 'INC-2026-0722', status: 'suppressed', trigger_time: '2026-06-17 09:30:00+08' },
  { id: 7,  level: 'info',     title: '连接数接近上限',         resource: 'redis-cluster (华东区域)', category: '容量类', incident_id: 'INC-2026-0718', status: 'firing',    trigger_time: '2026-06-17 09:20:00+08' },
  { id: 9,  level: 'critical', title: 'K8s Pod频繁重启',       resource: 'payment-service (prod)',   category: '服务类', incident_id: 'INC-2026-0715', status: 'resolved',  trigger_time: '2026-06-17 08:45:00+08' },
  { id: 10, level: 'warning',  title: '消息队列积压',           resource: 'kafka-consumer-group order', category: '容量类', incident_id: 'INC-2026-0719', status: 'resolved', trigger_time: '2026-06-17 07:30:00+08' },

  // === UNLINKED（无 incident_id，表格中不显示）===
  { id: 2,  level: 'critical', title: '磁盘空间不足',           resource: 'db-primary (华东区域)',    category: '容量类', incident_id: null, status: 'firing',    trigger_time: '2026-06-17 10:28:00+08' },
  { id: 8,  level: 'info',     title: '证书即将过期',           resource: 'cdn-domain.example.com',   category: '证书类', incident_id: null, status: 'firing',    trigger_time: '2026-06-17 08:00:00+08' },
  { id: 11, level: 'warning',  title: '网络丢包率过高',         resource: 'switch-01 (华北区域)',      category: '网络类', incident_id: null, status: 'firing',    trigger_time: '2026-06-17 06:30:00+08' },
  { id: 12, level: 'info',     title: 'NTP同步偏移过大',       resource: 'ntp-server',                category: '阈值类', incident_id: null, status: 'resolved',  trigger_time: '2026-06-16 23:00:00+08' },
]
```

### B.5 alerts → MOCK_INCIDENTS 关联映射表

| alert# | title | incident_id | MOCK_INCIDENTS.title | 表格显示 |
|---|---|---|---|---|
| 1 | CPU使用率超过90% | INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | ✅ |
| 2 | 磁盘空间不足 | null | — | ❌ UNLINKED |
| 3 | 数据库主从延迟 | INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | ✅ |
| 4 | 内存使用率偏高 | INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | ✅ |
| 5 | 响应时间超时 | INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | ✅ |
| 6 | HTTP 5xx错误率上升 | INC-2026-0722 | 库存服务扣减接口超时告警 | ✅ |
| 7 | 连接数接近上限 | INC-2026-0718 | 用户服务登录鉴权超时 | ✅ |
| 8 | 证书即将过期 | null | — | ❌ UNLINKED |
| 9 | K8s Pod频繁重启 | INC-2026-0715 | 支付回调链路 MQ 消息堆积 | ✅ |
| 10 | 消息队列积压 | INC-2026-0719 | 消息网关 WebSocket 连接数异常飙升 | ✅ |
| 11 | 网络丢包率过高 | null | — | ❌ UNLINKED |
| 12 | NTP同步偏移过大 | null | — | ❌ UNLINKED |

**关键规则：**
- 表格中"故障名称"列显示的是 MOCK_INCIDENTS.title（业务影响描述），不是 alert.title（原始告警标题）
- "关联告警"数 = 同一 `incident_id` 下的 alert 数量（如 INC-2026-0720 有 4 条）
- `incident_id = null` 的告警被过滤，不出现在表格中

### B.6 `/api/alarm/overview-stats` 硬编码数据

```js
heroStats: {
  closedCount: 3452,    // 硬编码基数 + resolved 告警数
  reductionRate: 91.5,  // 硬编码
  autoRate: 78.3,       // 硬编码
  savedHours: 280,      // 硬编码
},
funnelData: { raw: 100000, dedup: 85000, agg: 8500, rate: 91.5 }, // 硬编码
trendData: {
  labels: ['06-11', '06-12', '06-13', '06-14', '06-15', '06-16', '06-17'],
  aiClosed: [120, 135, 142, 155, 168, 180, 195],
  manualClosed: [300, 290, 275, 260, 240, 230, 220],
},
healingRecords: [
  { id: 1, time: '06-17 09:15', alert: 'K8s Pod频繁重启', resource: 'payment-service', action: '平滑重启+拨测', result: 'success', duration: '45s', incidentId: 'INC-2026-0720' },
  { id: 2, time: '06-17 08:30', alert: '磁盘空间不足', resource: 'db-primary', action: '清理日志+扩容20%', result: 'success', duration: '1m20s', incidentId: 'INC-2026-0719' },
  { id: 3, time: '06-16 23:00', alert: 'NTP偏移过大', resource: 'ntp-server', action: '重启NTP服务', result: 'success', duration: '30s', incidentId: 'INC-2026-0718' },
  { id: 4, time: '06-16 18:00', alert: '证书即将过期', resource: 'cdn-domain', action: '申请新证书(待审批)', result: 'pending', duration: '—', incidentId: 'INC-2026-0717' },
],
```

### B.7 前端文件完整清单

| 文件 | 关键内容 | 行数 |
|---|---|---|
| `src/views/alarm/AlarmAnalysisView.vue` | 主页面：5行布局、G2图表、表格、搜索、筛选、drawer | ~350行 |
| `src/views/alarm/AlarmDetailView.vue` | 详情页：故障名称header、证据链、AI建议、处理记录 | ~290行 |
| `src/components/aiops/AiopsAppCards.vue` | 首页应用卡片（无icon、14px分数） | ~80行 |
| `src/components/aiops/AiopsHealingRecords.vue` | 首页自愈记录（无icon、查看全部链接） | ~70行 |
| `src/router/index.js` | 路由：重定向 + 详情页 | 2行 |
| `src/App.vue` | 导航高亮 + Drawer CSS修复 | 3行 |
| `server/server.js` | 3个API + MOCK_INCIDENTS(7条) + 过滤逻辑 | ~140行 |
| `server/db/mockData.js` | alerts表(12条，8条有incident_id) | 14行 |
| `tests/alarm-analysis.spec.js` | 28个Playwright测试 | ~310行 |

### B.8 新页面搭建检查清单

如果要搭建类似的新模块，按以下顺序：

1. **路由** — `src/router/index.js` 添加路由（重定向 + 详情页）
2. **导航高亮** — `src/App.vue` 的 `nav-item :class` 添加路径判断
3. **后端 API** — `server/server.js` 添加端点（在 `app.use('/api/cmdb')` 之前）
4. **Mock 数据** — `server/db/mockData.js` 添加数据表，或在 `server.js` 中硬编码
5. **主页面** — `src/views/xxx/XXXView.vue`（5行布局：Hero→图表→操作栏→筛选→表格）
6. **详情页** — `src/views/xxx/XXXDetailView.vue`（header→证据→建议→处理记录）
7. **组件** — 首页卡片/记录组件（如需要嵌入首页）
8. **Vite proxy** — `vite.config.js` 添加 API 代理（如新路径）
9. **测试** — `tests/xxx.spec.js`（Playwright，用 `page.locator` 断言）
10. **重启后端** — `lsof -i :3001 -t | xargs kill -9 && nohup node server/server.js &`
11. **运行测试** — `npx playwright test tests/xxx.spec.js`
12. **记录变更** — 写入 `docs/alarm-analysis-session-log-YYYYMMDD.md`
