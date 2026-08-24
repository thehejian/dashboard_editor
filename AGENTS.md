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
