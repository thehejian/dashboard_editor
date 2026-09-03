# AGENTS.md — Dashboard Editor

Vue 3.5 + Vite 6.3 + Ant Design Vue 4.2.6 运维监控系统。6 个顶部导航模块，30+ 页面。

## 命令

```bash
bash start.sh                              # nohup 启动前后台（推荐）
nohup npm run dev > /tmp/vite.log 2>&1 &   # 前台（port 5173）
nohup node server/server.js > /tmp/server.log 2>&1 &  # 后台（port 3001）
npm run build                              # 构建 dist/
npx playwright test                        # E2E 测试
```

**禁止直接用 Playwright 截图/evaluate 做视觉验证**，只用它跑 `tests/*.spec.js` 现有测试。  
**修改后端数据/mock/API 后必须重启后端**：`lsof -i :3001 -t | xargs kill -9` → 重新 `nohup node server/server.js`，否则改动不生效。前端 Vite 有 HMR 自动热更新，后端没有。  
**每日变更记录**：每天结束时将当日所有变更写入 `docs/alarm-analysis-session-log-YYYYMMDD.md`，必须包含：修改内容概述、涉及页面、涉及文件、具体修改内容（改前/改后代码）、可能出现的问题及解决方法。格式参考已有文档。

Node/npm 不在 PATH → `export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"`。  
Bash tool 超时会杀死前台进程 → 必须 `nohup` 或 `start.sh` 脱离进程组。  
`lsof -i :5173 -i :3001` 确认服务状态。  
Vite basic auth：`http://admin:745544752@localhost:5173`（`SecurityError: replaceState` 不影响渲染）。

## API 代理

| 路径 | 目标 | 说明 |
|---|---|---|
| `/api/v1` | `http://192.168.0.155:9090` | 外部运维 API |
| `/api/cmdb` / `/api/vm` / `/api/nas` / `/api/portainer` / `/api/ai` / `/api/mock` / `/api/intelligent` | `localhost:3001` | Express 后端 |

后端 Express + PostgreSQL，36 张表（白名单见 `server/routes/cmdb.js`）。CMDB 自动 CRUD：`GET/POST /api/cmdb/:table`，`GET/PUT/DELETE /api/cmdb/:table/:id`，支持 `?page=&pageSize=&sort=&order=&field=val`。  
**Express catch-all 必须放最后**：自定义端点需在 `app.use('/api/cmdb', cmdbRouter)` 前注册，并同步添加 Vite proxy。

## 路由

`src/router/index.js`。扁平 + 4 组嵌套路由（`/ops/logs/*`×10、`/ops/account/*`×17、`/system/security/*`×9、`/ops/settings/*`×3）。  
Dashboard 特殊：`/dashboard/:slug` → `EmptyRoute.vue`，由 `App.vue` `v-if="isDashboardMode"` 分支渲染（含通用工具栏/配置面板/FAB）。自定义 Dashboard 组件（OBS/VM/NAS/Container/BigData）不依赖通用工具栏，`isCustomDashboard` 控制隐藏。  
`redirect` 不能与 `children` 同层级 → `{ path: '', redirect: '...' }`。

## 依赖

- Font Awesome 6：`index.html` CDN 引入，非 npm
- G2 5 / G6 5：`@antv/g2`、`@antv/g6`
- Ant Design Vue：`main.js` `app.use(antd)` 全量全局注册
- 无 Vuex/Pinia → `composables/useEditorState.js` `reactive()` 单例
- `html2canvas` + `jspdf`（导出），`vuedraggable`（拖拽）

## 布局

- 导航栏 `height: 48px`，`#app` `padding-top: 48px`
- 嵌套路由父容器：左侧 200px 导航 + `<router-view />`
- 列表页模板：`.page-header > h3` → `.filter-bar`(gap 8px, 搜索框 `flex:1` 居右) → `a-table`。新建按钮 `margin-left: auto`。控件 32px（不加 `size="small"`）
- 告警管理：`.alarm-content` `padding: 0 24px 24px`，子页面 `.page-view` `padding: 0`。三行：按钮行→筛选行→表格
- CSS 变量 `App.vue:304-316`（`--brand: #007DFF` 等）

## G6 v5 注意

- `e.target?.id` 获取节点 ID，**不是** `e.itemId`
- `getChildrenData(comboId)` 返回空 → 用 `getNodeData().filter(d => d.combo === id)`
- 坐标用 `getElementPosition()` 或 `style.x/y`，`getClientByCanvas([x,y])` 转屏幕
- hover-activate behavior 不响应 DOM → 手动 `graph.on('node:pointerenter', ...)` + `setItemState`
- 内置 tooltip 插件 `getContent` 返回字符串，加 `pointer-events:none` 避免交互穿透

## CMDB 数据

- mock 数据直接写在 views 中，无独立 mock 层
- 首页用 `useEditorState.js` 的 `DASHBOARDS`/`CHARTS_DATA`

## AI Chat

- 后端 for-loop 重试（最多 2 次，间隔 1s）应对 LLM 空回复
- Action 格式 `[[action:文字:补充prompt]]`，后端正则解析返回 `actions` 数组
- 判空 `data.reply || data.actions?.length`（reply 空但 actions 存在）
- Node 22 `fetch()` 与 Agnes API 有 TLS 兼容问题 → `exec(curl)` 回退
- nohup 启动进程 PATH 不全 → 启动前 `export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"`

## Playwright

- `playwright.config.js`：`baseURL` 带 basic auth，`webServer` 自动拉起 dev server
- 测试文件 `tests/*.spec.js`，需后端也运行（`start.sh` 或分别 nohup 启动）
- G2 渲染到 Canvas 非 SVG → 用 `canvas.width`/`getImageData()` 验证而非 `querySelector('svg')`

### 回归门禁（2026-08-26 起，任何改动必须先过）

```bash
npx playwright test tests/site-audit.spec.js --reporter=list   # 全站门禁：96 页渲染×样式规范 + 导航/重定向/大屏/左侧树跳转
npx playwright test --reporter=list                            # 提交前全量（约 12 分钟）
```

- `tests/site-audit.spec.js` 是全站巡检入口（A 渲染/B 顶导航/C 重定向/D 大屏/E 左侧树菜单），报告写 `test-results/site-audit-report-*.json`
- 巡检覆盖的样式规范：`.header` 48px、`#app padding-top:48px`、`--brand:#007DFF`、`.page-header>h3`、含表格页必须有筛选能力、筛选控件 32px（affix 输入框量 wrapper 层）、搜索框末位贴右（按内容盒算）
- **antd Tree 有展开动画幽灵节点**（`.ant-tree-treenode[visibility:hidden]`），定位必须用 `:visible` 过滤
- 后端 3001 未启动时 site-audit 会快速失败并提示 `bash start.sh`
- 新增路由/导航项时同步更新 site-audit 的 `PAGES`/`REDIRECTS`/跳转清单

## NAS 监控

位于远程 Windows 桌面 `C:\Users\hejian\Desktop\nas\`（跳板机入口 `8.147.132.193:52222`）。

### 连接信息

| 目标 | 协议 | 地址 | 用户 | 密码 |
|---|---|---|---|---|
| Windows 跳板 | SSH | `8.147.132.193:52222` | hejian | Hjian!745544752 |
| QNAP NAS SSH | SSH | `8.147.132.193:62222` (外) / `192.168.0.160:22` (内) | admin | Hjian!745544752 |
| QNAP NAS Web | HTTP | `http://8.147.132.193:65000` (外) / `http://192.168.0.160:5000` (内) | admin | Hjian!745544752 |
| NAS 非管理员 | Web | 同上 | opencode | Hjian!745544752 (isAdmin=0 受限) |

密码 Base64: `SGppYW4hNzQ1NTQ0NzUy`

### NAS 规格
- 型号: QNAP TS-464C (Intel N5095, 4核)
- 内存: 8GB LPDDR4 (焊死不可升)
- 存储: 2×10TB RAID0 + 1TB NVMe 缓存
- 固件: QTS 5.2.9

### 经验教训

1. **直连优于跳板**：NAS SSH 端口 `62222` / Web 端口 `65000` 均对公网开放，无需经过 Windows 跳板。之前项目脚本全是内网 `192.168.0.160` 地址，需要 Windows 代理，效率低（15-30s vs 2s）
2. **QNAP Web API**：SID 必须作为 URL 查询参数 `?sid=xxx`，仅设 Cookie 不够；QTS 5.2.6+ 只 `sysRequest.cgi` 可用，storage/security/logRequest.cgi 全部 404
3. **Docker 非标准路径**：`/share/CACHEDEV2_DATA/.qpkg/container-station/usr/bin/.libs/docker`
4. **BusyBox**：`top -b -n 1 -m` 按内存排序，无 systemd 用 `/etc/init.d/`
5. **内存 97%**：QEMU 虚拟机占 2.6GB + Apache 代理 ~3GB，Swap 异常

## SRE 故障中心 (SRECopilotView)

### 布局要点
- 父容器 `height: 100vh; flex-direction: column`，`sre-content` 用 `flex: 1; min-height: 0` 撑满剩余空间（比 `calc(100vh - Npx)` 更灵活，不会溢出）
- 行按内容自然高度撑开（`flex-shrink: 0`），左边区域整体 `overflow-y: auto`，每个 cell 不独立滚动
- 右侧 Playbook 固定 380px，`overflow-y: auto` 独立滚动

### 组件经验
- **Vue 3 `<script setup>` props**：`defineProps` 返回的 props 在模板中可直接访问，但在 `<script>` 函数中需用 `const props = defineProps(...)` + `props.xxx`，或 `toRefs` 解构
- **G2 v5 tooltip**：`chart.interaction('tooltip', ...)` 启用，但自定义 tooltip 用 Vue `@mousemove` 事件追赶数据点比 G2 的 `render` 回调更可控
- **G2 双轴图**：双 View 共享 x 轴在小容器中容易重叠，单 View + `encode('color', 'type')` 合并数据更简洁
- **G6 v5 节点高亮**：用 `setElementState(id, stateName)` + 在 node 配置 `state: { stateName: { style } }`，而非手动修改 style
- **G6 下游节点 BFS**：`getDownstream(nodeId, edges)` 用队列遍历 edges，`visited` Set 去重，不包含自身

### markdown 表格转换
- `simpleMarkdownToHtml` 中 `\n{2,} → </p><p>` 必须在表格正则转换之后执行。否则 `\n\n` 被替换后表格正则 `(?=\n\n|$)` 永远找不到分隔符，吞并后续所有内容

## OBS 运维页侧滑改造（2026-08-14）

### Vue 3 string-template 组件注意事项
- `template:` 字符串在 `<script>` 中由运行时编译器生成 render function，标识符解析基于 **setup() return**，而非模块级 `const`
- 模板中引用的组件名（如 `ClusterDetail`、`PoolDetail`、`NodeDetail`）必须从 `setup()` 返回，否则为 `undefined` → `navigate` 发 `component: undefined` → 抽屉导航静默失败
- 每个 drawer 组件需在 `return { ... }` 中显式列出其模板引用的子组件
- 修复方式：逐一检查各组件 setup return，补齐被引用的组件名（如 `RegionDetail` 需 return `{ emit, ClusterDetail, SCDetail, ...useHelpers() }`）

### 作用域 CSS 对 string-template 无效
- `<style scoped>` 的 `data-v-xxx` 属性只作用于 `<template>` 块中的 DOM；`template:` 字符串内生成的 DOM 无此属性
- 在 string-template 抽屉组件中使用的自定义类（`.rld-usage`、`.rld-link`、`.dii-label` 等）必须写在 `<style>`（全局），不能放在 `<style scoped>`
- 症状：元素存在于 DOM 但无样式 → 空 `<span>` 因无 width/height 而 `hidden`

### 进度条在 auto table-layout 中宽度坍缩
- `<span class="rld-usage" :style="{ width: pct + '%' }">` 在 `table-layout: auto` 的 `<td>` 中，百分比宽度可能解析为 0
- 修复：外层固定宽度 track + 内层 fill div，例如：
  ```html
  <span class="rld-usage"><span class="rld-usage-fill" :style="{ width: pct + '%' }"></span></span>
  ```
  CSS: `.rld-usage { width: 100px; overflow: hidden; } .rld-usage-fill { height: 100%; }`

### git stash 与 playwright webServer 冲突
- 运行 `git stash && npx playwright test ...; git stash pop` 时，若测试期间 webServer/vite 修改了源文件，pop 会失败："local changes would be overwritten"
- 修复流程：
  1. `git checkout -- <file>` 丢弃意外变更（或保留手动合并）
  2. `git stash apply stash@{0}` 恢复完整工作区
  3. 始终保留 stash 作为备份，pop 前不 `drop`
- 经验：先确认 `git status` 干净再 stash pop；pop 失败时先 `git diff` 查当前状态再决定

### 抽屉多级导航测试稳定性
- 跨层抽屉跳转（SCDetail → PoolDetail → NodeDetail）依赖模板正确引用组件，否则静默失败
- 测试中建议用 `.dii-label`（详情信息标签）做导航成功的断言，比 `h3` 标题文本更可靠（标题可能与其他层级混淆）
- 测试顺序敏感：前一个测试未关闭侧滑会影响下一个；建议在测试末尾统一关闭侧滑或使用独立 fixture

## 告警分析页面经验教训

### 布局变更（2026-08-27）
- **Hero 指标卡**：从 4 个精简为 3 个（AI自动分析、告警降噪率、AI接管率），移除"节省人工时"
- **降噪过滤统计**：新增分级统计卡片，显示总过滤数 + 紧急/重要/次要告警数量
- **底部卡片**：移除"需要关注的应用/云服务"（AiopsAppCards）和"自动修复记录"（AiopsHealingRecords）
- **funnelData 字段**：需包含 `filteredCritical`、`filteredWarning`、`filteredInfo` 三个分级字段

### 后端数据
- **MOCK_INCIDENTS 位置**：硬编码在 `server.js` 中（约 L1100-1283），不在 `mockData.js`
- **alerts 表**：`server/db/mockData.js` L130-143，12 条告警，8 条有 `incident_id`，4 条 UNLINKED
- **incident_id 关联键**：alerts.incident_id 必须和 MOCK_INCIDENTS.id 完全一致，改任一侧关联会断
- **UNLINKED 过滤**：`/api/alarm/incidents` 过滤掉无 incident_id 的告警，如需显示移除 `.filter()`
- **handler 字段**：incident_id 有值 → 'ai'，无值 → 'manual'，前端用来区分标签颜色
- **can_heal 逻辑**：只有 `category === '容量类'` 返回 true，控制"故障自愈"按钮显示
- **重启后端**：修改 server.js 后必须 `lsof -i :3001 -t | xargs kill -9` 后重启，前端 HMR 自动更新后端没有

### 前端组件
- **表格列 dataIndex**：`'title'` 对应 MOCK_INCIDENTS.title（故障名称），`'incident_no'` 对应 INC-xxx
- **列表和详情标题一致**：两端都从 MOCK_INCIDENTS.title 取值，改一边要同步另一边
- **G2 v5 柱子粗细**：用 `encode('size', 16)` 精确控制，`style('maxHeight')` 不精确
- **Ant Design Drawer 关闭按钮**：默认在左侧，需全局 CSS 覆盖（`!important`，同时改 header-title 和 close）
- **搜索逻辑**：支持 title + incident_no + root_cause 三个字段匹配

### 导航和路由
- **高亮规则**：`/alarm-analysis*` 高亮"首页"菜单，`/alarm*`（排除 alarm-analysis）高亮"告警"菜单
- **重定向**：`/alarm-analysis` → `/overview?tab=alarm`，详情页 `/alarm-analysis/:id` 独立路由
- **详情页 `:id`**：= incident_no（如 `INC-2026-0720`），通过 `route.params.id` 取值

### Mock 时间戳过期问题（2026-08-28）
- **根因**：`server/db/mockData.js` 的 `minsAgo()` 在服务器启动时一次性执行，所有 mock 告警的时间戳固定。超过 1 小时后，"1小时内"聚合条件永远不满足 → tooltip/banner 消失
- **症状**：启动后 1h 内功能正常，1h 后 AI 聚合 tooltip 不再出现，banner 也不显示
- **修复**：在 `server/routes/cmdb.js` 的 `/api/cmdb/alerts` 端点中，对测试告警（id 17-22）动态注入新鲜时间戳（`freshTriggerTime()`），每次请求重新生成，确保始终落在聚合窗口内
- **教训**：mock 数据中使用相对时间（"5分钟前"、"1小时前"）时，必须考虑服务运行时长。静态 mock 适合一次性页面，动态接口需要动态时间戳

### Playwright 并发超时（2026-08-28）
- **症状**：全量跑 80+ 测试时，个别测试 `page.goto` 超时（30s），单跑或少量并发时正常
- **根因**：Vite dev server 单线程处理 HMR + 测试请求，并发 4 个 worker 时请求排队导致超时
- **解决**：`npx playwright test --workers=2` 降低并发，或增加 `timeout: 60000`
- **注意**：超时是随机的（不同测试文件），重新跑通常通过，不影响功能正确性

### AI 汇聚规则配置页（2026-08-28）
- **设计决策**：检测规则（Prometheus/Grafana/Zabbix 负责）不应混入汇聚规则配置，最终只保留"汇聚规则 + AI优化建议"两个 Tab
- **AI建议聚焦**：窗口调优、规则合并、新规则推荐、阈值优化（不涉及检测规则优化）
- **Drawer 4面板**：基本信息（AI可辅助）→ 条件（AI可辅助）→ 汇聚参数（AI核心推荐）→ 汇聚动作 + AI影响预估
- **联动入口**：当前告警 banner `查看规则配置` → 跳转 `/alarm/settings/rules?tab=aggregation`；告警分析 Drawer 规则标签可点击跳转；扩展页第4个 Tab "汇聚规则"；个性化页聚合开关旁 `[配置]` 按钮

## Ant Design Tooltip 样式覆盖经验

### 核心问题
Ant Design Vue 的 Tooltip 组件渲染在 **portal**（`document.body` 下），不在组件 DOM 树内。`<style scoped>` 的 `data-v-xxx` 属性无法匹配到 portal 中的元素，导致 scoped 样式完全失效。

### 解决方案
必须在组件中添加**非 scoped** 的 `<style>` 块来覆盖 Tooltip 样式：

```vue
<style scoped>
/* 组件内部样式 */
</style>

<style>
/* Tooltip 样式覆盖（非 scoped，因 tooltip 渲染在 portal 中） */
.ant-tooltip .ant-tooltip-inner {
  background: #fff !important;
  color: #1a1a1a !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #f0f0f0 !important;
  border-radius: 8px !important;
}
.ant-tooltip .ant-tooltip-arrow::before,
.ant-tooltip .ant-tooltip-arrow::after {
  background: #fff !important;
}
</style>
```

### 经验教训
1. **`<style scoped>` 对 portal 组件无效**：Tooltip、Modal、Dropdown 等渲染在 `document.body` 的组件，scoped 样式无法穿透
2. **`:deep()` 穿透 scoped 仅限子组件 DOM**：`:deep(.ant-tooltip)` 能穿透子组件的 scoped，但不能穿透 portal
3. **必须用 `!important`**：Ant Design 内联样式优先级高，覆盖时需要 `!important`
4. **箭头也要改**：只改 `.ant-tooltip-inner` 背景，箭头仍是默认深色，需同时覆盖 `.ant-tooltip-arrow::before/after`
5. **调试方法**：用 Playwright `page.evaluate(() => getComputedStyle(tooltip))` 验证实际生效的样式值
6. **同类组件**：Modal、Drawer、Dropdown、Popover 等 portal 组件都有相同问题

## Dashboard 新增自定义大屏经验（2026-09-03）

### 新增自定义 Dashboard 流程
1. `useEditorState.js` DASHBOARDS 数组加 `createDashboard(id, title, region, period, null, slug)`
2. `App.vue` 加 `isXxxDashboard` computed + 加入 `isCustomDashboard` + 模板加 `<XxxDashboard v-else-if="isXxxDashboard" />` + import
3. 新建 `src/components/XxxDashboard.vue`，参考 `BigDataDashboard.vue` 模式

### G2 图表默认渲染
- 不手动设置 `.scale('color', ...)`、`.label(...)`、`.style('stroke', ...)` 等，让 G2 用内置默认主题渲染
- 手写图例（如 `.aad-donut-legend`、`.aad-legend-row`）应去掉，G2 自带 legend
- 只保留 `data + encode`，去掉所有自定义配色/标签/样式覆盖

### 环形图中心文字定位
- G2 legend 占顶部空间（约 30-40px），把环形图往下挤
- `.aad-donut-center` 用 `position: absolute; top: 40px` 补偿 legend 偏移，让文字对齐环洞视觉中心
- 不要用 `top: 0; bottom: 0` 居中整个容器，会和环形图错位

### canvas-scroll padding 影响范围
- `App.vue` 的 `.canvas-scroll` padding 是所有大屏共享的，改了会影响全部 9 个大屏页
- 自定义 Dashboard 应在组件内部控制自己的间距，不要依赖 canvas-scroll
- 有自带 toolbar 的大屏（宿主机/大数据等）不需要额外 top padding
- 无 toolbar 的大屏（如 AI Agent）在组件内加 `padding-top` 或自建 toolbar

### 自定义 Dashboard Toolbar
- 在组件内自建 toolbar（时间 pills + 自动刷新），比依赖 App.vue 的 canvas-toolbar 更灵活
- `.isCustomDashboard` 为 true 时 App.vue 会隐藏 canvas-toolbar，需自行实现
- toolbar padding 统一 `16px 0`，不用 margin，靠内容自然间距

### 间距统一原则
- 所有 gap/margin/padding 统一用同一个值（推荐 16px）
- 不要混用 12px gap + 16px margin + 8px padding，视觉混乱
- hero 区需要 `margin-bottom: 16px` 和下方内容分隔
- charts-row 用 `gap: 16px` + `margin-bottom: 16px`

### Agent 卡片网格
- 横向滚动 flex 布局空间紧张，改为 `grid-template-columns: repeat(4, 1fr)` 4 列网格
- 外层用大卡片（白色背景 + padding）包裹标题和所有子卡片
- 子卡片用浅灰背景 `#f7f8fa` 区分层级
- 响应式断点：1200px→3列，900px→2列，600px→1列

### 测试注意
- 新增大屏后需同步更新 `tests/site-audit.spec.js` 的 `DASH_SLUGS` 数组
- `page.goto` 用 `waitUntil: 'load'` 而非 `'networkidle'`，避免 Prometheus 等外部请求超时
