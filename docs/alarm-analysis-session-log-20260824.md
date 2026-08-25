# 告警分析页面变更记录

> 时间范围：2026-08-21 ~ 2026-08-25  
> 最后更新：2026-08-25  
> 基于已完成的告警分析页面，记录所有修改内容。

---

## 变更1：表格列重命名+换序

### 涉及页面
- 告警分析主页（`/overview?tab=alarm`）

### 涉及文件
- `src/views/alarm/AlarmAnalysisView.vue`

### 具体修改内容

**改前（L212-214）：**
```js
const alarmIncidentColumns = [
  { title: '事件ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true },
  { title: '根因摘要', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
```

**改后：**
```js
const alarmIncidentColumns = [
  { title: '故障名称', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },       // ← 第一列
  { title: '故障ID', dataIndex: 'incident_no', key: 'incident_no', width: 120, ellipsis: true }, // ← 第二列
  { title: '关联告警', dataIndex: 'affected_count', key: 'affected_count', width: 70 },
```

**要点：**
- 故障名称（`dataIndex: 'title'`）是蓝链接，点击跳转 `/ops/incident/:id`
- 故障ID（`dataIndex: 'incident_no'`）是纯文字
- 模板中 `column.key === 'title'` 的渲染逻辑不需要改（key 没变）

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 列名改了没改测试 | Playwright 断言失败 `Expected: "故障名称" Received: "事件ID"` | 同步更新 `tests/alarm-analysis.spec.js` 中的断言 |
| dataIndex 搞混 | 故障名称列显示 INC-xxx 而不是标题 | `dataIndex: 'title'` 对应 MOCK_INCIDENTS.title，`dataIndex: 'incident_no'` 对应 INC-xxx |

---

## 变更2：后端取 MOCK_INCIDENTS.title

### 涉及页面
- 告警分析主页（表格"故障名称"列）
- 故障详情页（header 故障名称）

### 涉及文件
- `server/server.js`

### 具体修改内容

**修改2.1：`/api/alarm/incidents`（L2096-2103）**

改前：
```js
const key = a.incident_id || 'UNLINKED-' + a.id
if (!groupMap[key]) {
  groupMap[key] = {
    incident_no: key,
    title: a.title,           // ← 直接用告警标题（如"CPU使用率超过90%"）
    root_cause: a.title,
```

改后：
```js
const key = a.incident_id || 'UNLINKED-' + a.id
const sreIncident = a.incident_id ? MOCK_INCIDENTS.find(i => i.id === a.incident_id) : null
if (!groupMap[key]) {
  groupMap[key] = {
    incident_no: key,
    title: sreIncident?.title || a.title,        // ← 优先取 MOCK_INCIDENTS（如"购物车核心交易链路数据库连接耗尽"）
    root_cause: sreIncident?.description || a.title,
```

**修改2.2：`/api/alarm/incidents/:id`（L2148）**

改前：
```js
title: firstAlert.title,
```

改后：
```js
title: sreIncident?.title || firstAlert.title,
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 改了后端没重启 | 页面仍显示原始告警标题 | `lsof -i :3001 -t \| xargs kill -9` 后重启 |
| incident_id 不匹配 | title 回退到 alert.title | 确保 alerts 表的 incident_id 和 MOCK_INCIDENTS.id 完全一致 |
| 列表和详情标题不一致 | 两端显示不同名称 | 确保列表和详情 API 都从 MOCK_INCIDENTS.title 取值 |

---

## 变更3：过滤 UNLINKED 告警

### 涉及页面
- 告警分析主页（表格只显示有 SRE 故障中心对应的记录）

### 涉及文件
- `server/server.js`

### 具体修改内容

**改前（L2118）：**
```js
const data = Object.values(groupMap)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
```

**改后：**
```js
const data = Object.values(groupMap)
    .filter(g => MOCK_INCIDENTS.some(i => i.id === g.incident_no))  // ← 新增：只保留 linked
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 表格数据变少 | 原来 9 条现在只有 5 条 | 这是预期行为，UNLINKED 告警被过滤 |
| 想显示所有告警 | 需要展示无 incident_id 的告警 | 移除 `.filter()` 行 |

**过滤前（9条）→ 过滤后（5条）：**

| 故障ID | 故障名称 | 关联告警数 |
|---|---|---|
| INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | 4 |
| INC-2026-0722 | 库存服务扣减接口超时告警 | 1 |
| INC-2026-0718 | 用户服务登录鉴权超时 | 1 |
| INC-2026-0715 | 支付回调链路 MQ 消息堆积 | 1 |
| INC-2026-0719 | 消息网关 WebSocket 连接数异常飙升 | 1 |

---

## 变更4：搜索增加故障ID

### 涉及页面
- 告警分析主页

### 涉及文件
- `src/views/alarm/AlarmAnalysisView.vue`

### 具体修改内容

**修改4.1：搜索框 placeholder（L70）**

改前：
```html
<a-input-search placeholder="搜索事件、根因" ... />
```

改后：
```html
<a-input-search placeholder="搜索故障名称、ID" ... />
```

**修改4.2：搜索逻辑（L322）**

改前：
```js
list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
```

改后：
```js
list = list.filter(a => a.title.toLowerCase().includes(kw) || (a.incident_no || '').toLowerCase().includes(kw) || (a.root_cause || '').toLowerCase().includes(kw))
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 搜索 INC-xxx 搜不到 | 输入故障ID无结果 | 确认搜索逻辑包含 `incident_no` 字段 |

---

## 变更5：详情页显示故障名称

### 涉及页面
- 故障详情页（`/alarm-analysis/:id`）

### 涉及文件
- `src/views/alarm/AlarmDetailView.vue`

### 具体修改内容

**改前（L7-9）：**
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

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 故障名称显示 undefined | incident?.title 为空 | 确保后端 API 返回 incident.title 字段 |
| 列表和详情标题不一致 | 两端显示不同名称 | 确保两端都从 MOCK_INCIDENTS.title 取值 |

---

## 变更6：图表柱子变细

### 涉及页面
- 告警分析主页（TopN 图表、漏斗图）

### 涉及文件
- `src/views/alarm/AlarmAnalysisView.vue`

### 具体修改内容

**修改6.1：TopN 图表（L275）**

改前：
```js
topnChart.interval().encode('x', 'category').encode('y', 'pct')
```

改后：
```js
topnChart.interval().encode('x', 'category').encode('y', 'pct').encode('size', 16)
```

**修改6.2：漏斗图（L294）**

改前：
```js
funnelChart.interval().encode('x', 'step').encode('y', 'count')
```

改后：
```js
funnelChart.interval().encode('x', 'step').encode('y', 'count').encode('size', 16)
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 用 `style('maxHeight')` 不精确 | 柱子高度偏差大 | 必须用 `encode('size', 16)` |
| size 值太大/太小 | 柱子太粗或太细 | 16 约为行高 50-60%，视觉效果较好 |
| 对非 transposed 图表无效 | 纵向柱图不受影响 | `encode('size')` 对横向条形图有效 |

---

## 变更7：Ant Design Drawer 关闭按钮靠右

### 涉及页面
- 全局（影响所有 `<a-drawer>` 组件，共 6 处用法）

### 涉及文件
- `src/App.vue`

### 具体修改内容

**问题：** Ant Design Vue 的 `<a-drawer>` 关闭按钮（X icon）默认在标题左侧。

**DOM 结构分析：**
```
.ant-drawer-header (display:flex)
  .ant-drawer-header-title (display:flex)
    .ant-drawer-close        ← 关闭按钮，是 header-title 的第一个子元素
    .ant-drawer-title        ← 标题文字，是第二个子元素
```

**改前：** 无相关 CSS

**改后（L438-440）：**
```css
/* Ant Design Drawer 关闭按钮靠右 */
.ant-drawer-header { display: flex !important; justify-content: flex-end !important; }
.ant-drawer-header-title { display: flex !important; justify-content: flex-end !important; width: 100% !important; }
.ant-drawer-close { order: 99 !important; margin-left: auto !important; }
```

**原理：**
1. `header-title` 设为 `flex-end` + `width: 100%`，让标题文字占满宽度
2. `close` 按钮设 `order: 99` 强制排到最后，`margin-left: auto` 推到最右

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| CSS 优先级不够 | close 位置没变 | 必须用 `!important`，Ant Design CSS 优先级较高 |
| 只改了 header 不够 | close 还在左侧 | 必须同时改 `header-title` 和 `close` 两个层级 |
| 影响其他 drawer | 意外改变其他页面 drawer 样式 | 这是全局修复，所有 drawer 统一生效 |

---

## 变更8：测试同步更新

### 涉及页面
- 无（测试文件）

### 涉及文件
- `tests/alarm-analysis.spec.js`

### 具体修改内容

**修改8.1：列名断言（L143-153）**

改前：
```js
test('Row3: 表格列包含事件ID、根因摘要、级别...', async ({ page }) => {
  expect(joined).toContain('事件ID')
  expect(joined).toContain('根因摘要')
```

改后：
```js
test('Row3: 表格列包含故障名称、故障ID、级别...', async ({ page }) => {
  expect(joined).toContain('故障名称')
  expect(joined).toContain('故障ID')
```

**修改8.2：测试名更新（L197）**

改前：
```js
test('根因摘要是蓝色链接，点击跳转到故障详情', ...
```

改后：
```js
test('故障名称是蓝色链接，点击跳转到故障详情', ...
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 测试失败 | `Expected: "故障名称" Received: "事件ID"` | 同步更新测试中的列名断言 |

---

## 变更9：App.vue 导航高亮规则

### 涉及页面
- 全局导航栏

### 涉及文件
- `src/App.vue`

### 具体修改内容

**L7：首页 tab 高亮：**
```js
:path === '/' || path === '/overview' || path === '/aiops' || path.startsWith('/alarm-analysis')
```

**L11：告警 tab 高亮：**
```js
path.startsWith('/alarm') && !path.startsWith('/alarm-analysis')
```

**要点：**
- `/alarm-analysis` 和 `/alarm-analysis/:id` 都高亮"首页"菜单
- `/alarm/current`、`/alarm/realtime` 等高亮"告警"菜单
- 新页面需在 App.vue 对应 `nav-item` 的 `:class` 中添加路径判断

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 新页面没高亮对应菜单 | 导航栏无 active 状态 | 在 App.vue 的 nav-item `:class` 中添加路径判断 |
| 高亮了错误的菜单 | 详情页高亮了"告警"而非"首页" | 确保 `startsWith('/alarm-analysis')` 在首页 tab 中 |

---

## 变更10：路由配置

### 涉及页面
- 告警分析主页
- 故障详情页

### 涉及文件
- `src/router/index.js`

### 具体修改内容

```js
// L7: 重定向 — 旧路径自动跳转
{ path: '/alarm-analysis', redirect: '/overview?tab=alarm' },

// L8: 详情页 — 独立路由，不嵌套
{ path: '/alarm-analysis/:id', name: 'alarm-analysis-detail', component: () => import('../views/alarm/AlarmDetailView.vue') },
```

**要点：**
- `/alarm-analysis` 重定向到 `/overview?tab=alarm`（首页 tab 模式）
- `/alarm-analysis/:id` 是独立路由，`AlarmDetailView.vue` 单独渲染
- `:id` = `incident_no`（如 `INC-2026-0720`）

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 详情页 404 | 路由未注册 | 确保 `/alarm-analysis/:id` 路由存在 |
| 重定向失效 | `/alarm-analysis` 不跳转 | 确保 redirect 路径正确 |

---

## 变更11：后端 API 端点

### 涉及页面
- 告警分析主页
- 故障详情页

### 涉及文件
- `server/server.js`

### 具体修改内容

| 端点 | 行号 | 用途 | 调用方 |
|---|---|---|---|
| `GET /api/alarm/incidents` | L2093-2122 | 告警聚合事件列表（主表格） | AlarmAnalysisView |
| `GET /api/alarm/incidents/:id` | L2125-2169 | 单个 Incident 完整分析数据（详情页） | AlarmDetailView |
| `GET /api/alarm/overview-stats` | L2172-2218 | Hero Metric 概览数据（图表+自愈记录） | AlarmAnalysisView |

**`/api/alarm/incidents` 返回字段映射：**
```js
{
  incident_no: 'INC-2026-0720',     // key = alert.incident_id
  title: MOCK_INCIDENTS.title,       // 故障名称
  root_cause: MOCK_INCIDENTS.description,
  level: 'critical',                 // 取关联告警中最高级别
  category: '容量类',                 // 取第一条告警的分类
  status: 'investigating',           // firing → investigating
  affected_count: 4,                 // 关联告警数
  handler: 'ai',                     // 有 incident_id → 'ai'
  related_alerts: [alert1, alert2, ...],
}
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| API 返回空数组 | PostgreSQL alerts 表为空 | 确保 mockData.js 中有 alerts 数据 |
| handler 字段不对 | 标签颜色不对 | `incident_id` 有值 → 'ai'，无值 → 'manual' |
| can_heal 不对 | "故障自愈"按钮不显示 | 只有 `category === '容量类'` 才返回 true |

---

## 变更12：Mock 数据

### 涉及页面
- 告警分析主页
- 故障详情页

### 涉及文件
- `server/server.js`（MOCK_INCIDENTS，L1100-1283）
- `server/db/mockData.js`（alerts 表，L130-143）

### 具体修改内容

**MOCK_INCIDENTS（7条故障）：**

| id | title | status | severity | relatedAlertIds |
|---|---|---|---|---|
| INC-2026-0720 | 购物车核心交易链路数据库连接耗尽 | healing | P1 | [1,3,4,5] |
| INC-2026-0718 | 用户服务登录鉴权超时 | resolved | P2 | [7] |
| INC-2026-0715 | 支付回调链路 MQ 消息堆积 | resolved | P2 | [9] |
| INC-2026-0722 | 库存服务扣减接口超时告警 | investigating | P2 | [6] |
| INC-2026-0719 | 消息网关 WebSocket 连接数异常飙升 | investigating | P2 | [10] |
| INC-2026-0721 | 推荐服务模型推理延迟升高 | investigating | P3 | [] |
| INC-2026-0717 | 日志采集 Agent 批量丢失 | investigating | P3 | [] |

**alerts 表（12条告警）：**

| id | title | incident_id | 表格显示 |
|---|---|---|---|
| 1 | CPU使用率超过90% | INC-2026-0720 | ✅ |
| 2 | 磁盘空间不足 | null | ❌ UNLINKED |
| 3 | 数据库主从延迟 | INC-2026-0720 | ✅ |
| 4 | 内存使用率偏高 | INC-2026-0720 | ✅ |
| 5 | 响应时间超时 | INC-2026-0720 | ✅ |
| 6 | HTTP 5xx错误率上升 | INC-2026-0722 | ✅ |
| 7 | 连接数接近上限 | INC-2026-0718 | ✅ |
| 8 | 证书即将过期 | null | ❌ UNLINKED |
| 9 | K8s Pod频繁重启 | INC-2026-0715 | ✅ |
| 10 | 消息队列积压 | INC-2026-0719 | ✅ |
| 11 | 网络丢包率过高 | null | ❌ UNLINKED |
| 12 | NTP同步偏移过大 | null | ❌ UNLINKED |

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| MOCK_INCIDENTS 位置 | 硬编码在 server.js 中 | 不在 mockData.js，因为是临时 mock |
| getTable('alerts') 读 PostgreSQL | alerts 是白名单表 | 如果 PostgreSQL 为空，API 返回空数组 |
| incident_id 不匹配 | 关联断裂 | alerts.incident_id 必须和 MOCK_INCIDENTS.id 完全一致 |

---

## 变更13：AGENTS.md 文档更新

### 涉及页面
- 无（文档）

### 涉及文件
- `AGENTS.md`

### 具体修改内容

新增一行（L15-16）：
```markdown
**修改后端数据/mock/API 后必须重启后端**：`lsof -i :3001 -t | xargs kill -9` →
重新 `nohup node server/server.js`，否则改动不生效。前端 Vite 有 HMR 自动热更新，后端没有。
```

新增一行（L17）：
```markdown
**每日变更记录**：每天结束时将当日所有变更写入 `docs/alarm-analysis-session-log-YYYYMMDD.md`，
必须包含：修改内容概述、涉及页面、涉及文件、具体修改内容（改前/改后代码）、可能出现的问题及解决方法。
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 后端改了没重启 | 页面显示旧数据 | 遵守 AGENTS.md 规则，修改后端后必须重启 |

---

## 附录：完整还原检查清单

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

---

## 附录：踩坑清单汇总

| # | 坑 | 表现 | 解决 |
|---|---|---|---|
| 1 | 后端改了没重启 | 页面显示旧数据（原始告警标题） | `lsof -i :3001 -t \| xargs kill -9` 后重启 |
| 2 | G2 v5 `style('maxHeight')` 不精确 | 柱子高度偏差大 | 用 `encode('size', 16)` |
| 3 | Drawer 关闭 icon 在左侧 | Ant Design 默认行为 | 全局 CSS 覆盖 `header`/`header-title`/`close` |
| 4 | CSS 优先级不够 | Drawer close 位置没变 | 必须用 `!important` |
| 5 | 列名改了没改测试 | Playwright 断言失败 | 同步更新 `tests/alarm-analysis.spec.js` |
| 6 | 详情页和列表页标题不一致 | 数据来源不同导致 | 两端都从 MOCK_INCIDENTS.title 取值 |
| 7 | 搜索框不搜故障ID | 用户输入 INC-xxx 搜不到 | 搜索逻辑加 `incident_no` 匹配 |
| 8 | MOCK_INCIDENTS 位置 | 不在 mockData.js | 硬编码在 server.js 中 |
| 9 | incident_id 不匹配 | 关联断裂 | alerts.incident_id 必须和 MOCK_INCIDENTS.id 一致 |
| 10 | can_heal 逻辑 | "故障自愈"按钮不显示 | 只有 category === '容量类' 才返回 true |

---

## 变更14：关联告警 Drawer 降噪概览

### 涉及页面
- 告警分析主页（关联告警 Drawer）

### 涉及文件
- `src/views/alarm/AlarmAnalysisView.vue`

### 具体修改内容

**改前（L178-219）：**
```html
<a-drawer :open="relatedDrawerVisible" title="关联告警" ...>
  <div class="related-drawer-incident">{{ relatedDrawerRecord.incident_no }}</div>
  <a-table :columns="relatedAlertColumns" ... />
  <div class="related-drawer-footer">...</div>
</a-drawer>
```

**改后：**
```html
<a-drawer :open="relatedDrawerVisible" title="关联告警" ...>
  <div class="related-drawer-incident">{{ relatedDrawerRecord.incident_no }} · {{ relatedDrawerRecord.title }}</div>

  <!-- 降噪概览卡片 -->
  <div class="rd-overview">
    <div class="rd-overview-title"><i class="fa-solid fa-chart-line"></i> 降噪概览</div>
    <div class="rd-overview-flow">
      <div class="rd-overview-step">
        <div class="rd-overview-step-val">{{ relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count }}</div>
        <div class="rd-overview-step-label">原始告警</div>
      </div>
      <div class="rd-overview-arrow"><i class="fa-solid fa-arrow-right"></i></div>
      <div class="rd-overview-step">
        <div class="rd-overview-step-val">{{ relatedDrawerRecord.affected_count }}</div>
        <div class="rd-overview-step-label">关联告警</div>
      </div>
      <div class="rd-overview-arrow"><i class="fa-solid fa-arrow-right"></i></div>
      <div class="rd-overview-step">
        <div class="rd-overview-step-val" :style="{ color: (relatedDrawerRecord.noise_reduction || 0) >= 80 ? '#52c41a' : (relatedDrawerRecord.noise_reduction || 0) >= 50 ? '#1890ff' : '#faad14' }">
          {{ relatedDrawerRecord.noise_reduction || 0 }}%
        </div>
        <div class="rd-overview-step-label">降噪率</div>
      </div>
    </div>
    <div class="rd-overview-filtered" v-if="(relatedDrawerRecord.raw_count || 0) > relatedDrawerRecord.affected_count">
      已过滤 {{ (relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count) - relatedDrawerRecord.affected_count }} 条重复/低优告警
    </div>
  </div>

  <!-- 关联告警表格 -->
  <a-table ... />

  <!-- 已过滤告警折叠区 -->
  <div class="rd-filtered-section" v-if="(relatedDrawerRecord.raw_count || 0) > relatedDrawerRecord.affected_count">
    <div class="rd-filtered-toggle" @click="filteredAlertVisible = !filteredAlertVisible">
      <i class="fa-solid" :class="filteredAlertVisible ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      已过滤告警 ({{ (relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count) - relatedDrawerRecord.affected_count }}条)
    </div>
    <div v-if="filteredAlertVisible" class="rd-filtered-list">
      <div v-for="(alert, idx) in generateFilteredAlerts(relatedDrawerRecord)" :key="idx" class="rd-filtered-item">
        <a-tag ...>{{ alert.level }}</a-tag>
        <span class="rd-filtered-title">{{ alert.title }}</span>
        <span class="rd-filtered-reason">{{ alert.reason }}</span>
      </div>
    </div>
  </div>

  <div class="related-drawer-footer">...</div>
</a-drawer>
```

**新增 JS（L351-370）：**
```js
const filteredAlertVisible = ref(false)

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
```

**新增 CSS（L653-675）：**
```css
.rd-overview { background: #f6f8fa; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
.rd-overview-title { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.rd-overview-flow { display: flex; align-items: center; justify-content: center; gap: 12px; }
.rd-overview-step { text-align: center; }
.rd-overview-step-val { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.rd-overview-step-label { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
.rd-overview-arrow { color: #d9d9d9; font-size: 12px; }
.rd-overview-filtered { font-size: 11px; color: #8c8c8c; text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; }
.rd-filtered-section { margin-top: 16px; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
.rd-filtered-toggle { padding: 10px 14px; font-size: 12px; font-weight: 500; color: #595959; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fafafa; }
.rd-filtered-toggle:hover { background: #f0f0f0; }
.rd-filtered-list { padding: 8px 14px; display: flex; flex-direction: column; gap: 6px; }
.rd-filtered-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.rd-filtered-item:last-child { border-bottom: none; }
.rd-filtered-title { flex: 1; color: #1a1a1a; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-filtered-reason { color: #8c8c8c; font-size: 11px; flex-shrink: 0; }
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 降噪概览不显示 | Drawer 打开但无概览卡片 | 确认 `relatedDrawerRecord` 有 `raw_count` 和 `affected_count` 字段 |
| 已过滤告警区不显示 | 无折叠区 | `raw_count` 必须 > `affected_count` 才显示 |
| generateFilteredAlerts 报错 | 控制台 JS 错误 | 确保函数在 `<script setup>` 中定义 |
| CSS 样式无效 | 概览卡片无背景色 | 确认 CSS 在 `<style>` 块中（非 scoped） |

---

## 变更15：测试修复

### 涉及文件
- `tests/alarm-analysis.spec.js`

### 具体修改内容

1. **图表标题断言**（L124-126）：`TopN 告警分类分布` → `告警类别分布`，`降噪漏斗` → `告警降噪过滤`，`处理趋势` → `告警AI处理趋势`
2. **降噪率数值**（L132）：`.aa-funnel-rate` → `.aa-hero-val`，`58%` → `76%`（匹配 mock 数据）

### 测试结果
- 39/39 全部通过

---

## 变更16：统一 Drawer（降噪详情 + 关联告警）

### 涉及页面
- 告警分析主页（关联告警 Drawer + 降噪详情 Drawer）

### 涉及文件
- `src/views/alarm/AlarmAnalysisView.vue`

### 具体修改内容

**改前：两个独立 Drawer**
- `relatedDrawerVisible` — 点击"关联告警"数字打开，标题"关联告警"
- `noiseDrawerVisible` — 点击"降噪率"数字打开，标题"降噪处理详情"
- 两者数据同源但各自为政，重复展示降噪信息

**改后：统一为一个 Drawer**
- 删除 `noiseDrawerVisible`/`noiseDrawerRecord`/`openNoiseReductionDrawer`
- `relatedDrawerVisible` 统一承载，标题改为"告警降噪详情"
- 降噪率数字点击也调用 `openRelatedDrawer(record)`

**统一 Drawer 结构：**
```
标题: 告警降噪详情
├── 故障编号 + 故障名称
├── 降噪概览卡片
│   ├── 原始告警 → 关联告警 → 降噪率（流程图）
│   └── 处理规则（3个 tag：同title+metric聚合 / 1h内≥3次触发 / 保留首条其余屏蔽）
├── 关联告警表格（级别/告警名称/资源/状态/触发时间/AI分析/查看详情）
├── 已过滤告警折叠区（默认折叠，展开显示过滤原因）
└── 查看告警根因按钮
```

**删除的旧样式：**
```css
/* 以下全部删除 */
.noise-drawer-overview, .noise-drawer-stat, .noise-drawer-stat-label,
.noise-drawer-stat-val, .noise-drawer-arrow, .noise-drawer-section,
.noise-drawer-section-title, .noise-drawer-rules, .noise-drawer-rule,
.noise-drawer-alert-list, .noise-drawer-alert-item, .noise-drawer-alert-title,
.noise-drawer-alert-resource, .noise-drawer-alert-more
```

**新增样式：**
```css
.rd-overview-rules { display: flex; ... }      /* 处理规则行 */
.rd-overview-rules-label { font-weight: 500; }
.rd-overview-rule { background: #fff; border: 1px solid #e8e8e8; ... }
.rd-section-title { ... }                      /* 关联告警标题 */
```

### 可能出现的问题及解决方法

| 问题 | 表现 | 解决 |
|---|---|---|
| 点击降噪率数字无反应 | Drawer 不打开 | 确认模板中 `openNoiseReductionDrawer` 已改为 `openRelatedDrawer` |
| noiseDrawerVisible 报错 | 控制台 JS 错误 | 确认已删除所有 `noiseDrawerVisible`/`noiseDrawerRecord` 引用 |
| 旧样式残留 | 页面有无用 CSS | 删除所有 `.noise-drawer-*` 样式 |

### 测试结果
- 39/39 全部通过
