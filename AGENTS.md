# AGENTS.md — Dashboard Editor

Vue 3.5 + Vite 6.3 + Ant Design Vue 4.2.6 运维监控系统。6 个顶部导航模块：首页 / 告警 / 监控 / 资源 / 运维 / 系统，约 30+ 页面。

## 命令

```bash
bash start.sh                        # nohup 同时启动前后台（推荐）
nohup npm run dev > /tmp/vite.log 2>&1 &   # 单独启动前台（port 5173）
nohup node server/server.js > /tmp/server.log 2>&1 & # 单独启动后台（port 3001）
npm run build                        # 构建 dist/
cd server && npm run dev             # 后端开发（交互式终端用）
cd server && npm run seed            # 通过 curl POST 初始化 seed 数据
```

Vite 配置了 basic auth，dev 访问带凭据的 URL：
```
http://admin:745544752@localhost:5173
```
playwright/curl 访问测试也用此格式（注意 `SecurityError: replaceState` 不影响渲染）。

无 lint/typecheck/测试命令。SPA 需服务端 `createWebHistory()` fallback。

## API 代理

| 路径 | 目标 | 说明 |
|---|---|---|
| `/api/v1` | `http://192.168.0.155:9090` | 外部运维 API |
| `/api/cmdb` | `http://localhost:3001` | 本地 CMDB 后端 |

CMDB 后端 Express + PostgreSQL (`192.168.0.155:2345`)，36 张表（CI/IAM/告警/账号/日志/运维）。

## 依赖注意

- **Font Awesome 6**：`index.html` CDN 引入（`fa-regular` / `fa-solid`），非 npm 包
- **G2 5** / **G6 5**：`@antv/g2` / `@antv/g6`，均为 v5
- **Ant Design Vue**：`main.js` `app.use(antd)` 全量全局注册
- **无 Vuex/Pinia**：全局状态用 `composables/useEditorState.js` 的 `reactive()` 单例
- 额外依赖：`html2canvas` + `jspdf`（导出），`vuedraggable`（拖拽排序）

## 路由

`src/router/index.js` — 扁平 + 4 组嵌套路由。

### 嵌套路由组

| 父容器 | 子页数 | 路径前缀 |
|---|---|---|
| `OpsLogManageView.vue` | 10 | `/ops/logs/*` |
| `AccountView.vue` | 17 | `/ops/account/*` |
| `SecurityView.vue` | 9 | `/system/security/*` |
| `SettingsView.vue` | 3 | `/ops/settings/*` |

Key: `redirect` 不能与 `children` 同层级 → `{ path: '', redirect: '...' }`。

### 独立路由

| 路径 | 组件 |
|---|---|
| `/` | `HomeView.vue` |
| `/alarm/current` | `RealtimeView.vue` |
| `/alarm/events` | `EventsView.vue` |
| `/monitor/resource` | `ResourceMonitorView.vue` |
| `/monitor/config` | `MonitorConfigView.vue` |
| `/monitor/topology` | `TopologyView.vue` |
| `/resource/list` | `AssetListView.vue` |
| `/ops/jobs` | `JobsView.vue` |
| `/ops/inspect` | `InspectView.vue` |
| `/system/config` | `SystemConfigView.vue` |

## 布局约定

- 导航栏 `height: 48px`，`#app` 有 `padding-top: 48px`
- 嵌套路由父容器：左侧 200px 导航 + `<router-view />`，mobile 用 `a-select` 替代
- 全屏创建页：父容器 `.create-mode`（`padding: 0; overflow: hidden`）
- 详情页：父容器 `.detail-mode`（`padding: 0`），`detail-header` 在父层级
- CSS 变量在 `App.vue:272-285`（`--brand: #007DFF`, `--text`, `--border`, `--rs: 6px` 等）
- 自定义侧滑面板统一模式：`position: fixed` + `right: -500px` → `right: 0` + 遮罩，参考 `HomeView.vue`

## 列表页模板

```
.page-header > h3
.filter-bar (a-select, a-range-picker, a-input-search, button)
a-table
```

- 搜索框在 filter-bar 最右侧
- 新建按钮 `margin-left: auto`
- 控件默认 32px（不加 `size="small"`）
- 间距：header→bar=16px, bar→table=16px, gap=8px

## 调试提示

- HMR 可能静默失效（大文件重写后）→ 刷新页面
- `a-table` `:row-class-name` 签名 `(record, index)`，非 `({ record })`
- 避免 template 箭头函数绑定 — AntD 回调用 `function() {}`
- G2 `chart.render()` 是 async
- G6 v5 无 `sourceAnchor`，用 port 系统；`getChildrenData(comboId)` 返回空 → 改用 `getNodeData().filter(d => d.combo === id)`
- G6 v5 事件对象用 `e.target?.id` 获取节点 ID，**不是** `e.itemId`（`itemId` 为 undefined）。`node:pointerenter`/`node:pointerleave` 事件正常触发但需手动调用 `setItemState`
- G6 v5 `getPosition()` 返回错误坐标，用 `getElementPosition()` 或 `style.x`/`style.y`；`getClientByCanvas([graphX, graphY])` 转屏幕坐标
- G6 v5 hover-activate behavior 注册后不响应 DOM 事件，需用 `graph.on('node:pointerenter', ...)` 手动实现
- fixed 元素在 `overflow: auto/hidden` 父容器内被裁剪 → 挂 body 层级

## 告警管理布局规范

告警管理（`AlarmManageView.vue`）使用左侧树形导航 + 右侧内容区布局：

- `.alarm-content` 控制左右 padding（`padding: 0 24px 24px`）
- 子页面 `.page-view` 左右 padding 为 `0`，避免叠加
- 统一三行布局：
  - 第1行：按钮独占一行，`justify-content: flex-end`
  - 第2行：筛选+搜索控件，搜索框 `flex: 1` 拉宽至列表右边缘
  - 第3行：表格

## 经验教训

- **G2 图表函数名大小写敏感**：`renderTopnChart`≠`renderTopNChart`，调用不存在的函数名会静默抛 TypeError，导致同名后续代码不执行，但已执行的前序图表（donut/bar/duration）不受影响
- **嵌套路由 padding 叠加**：父容器 `.alarm-content` 已有 24px padding，子页面 `.page-view` 不应再设左右 padding
- **按钮与筛选分离**：按钮行（操作）和筛选行（条件）需独立成两行，避免混杂
- **告警管理页面清单**：包含 7 个子页面（RealtimeView/HistoryView/EventsView/ConfigView/CustomizeView + settings/NotificationView + settings/ExtensionView），所有页面需保持一致的 header/筛选/表格 三行布局
- **Ant Design column header filter 替代 filter-bar select**：列表页状态筛选优先使用 `a-table` column 的 `filters` + `onFilter`（点击列头图标弹出），而非在 filter-bar 额外放置 Select。前者是 Ant Design 原生模式，无需维护独立 `filterStatus` ref，UI 更紧凑。`onFilter` 签名 = `(value, record) => record.status === value`，`filters` 格式 = `[{ text: '已启用', value: 'enabled' }]`。参考 `SafeBoxView.vue`
- **SafeBox modal 标题与内容对齐**：Ant Design Vue modal 的 `title` prop 渲染在 `.ant-modal-header` 内，默认有 padding，但 `<a-form>` body 的 padding 更大，导致左右不对齐。解法：用 `#title` slot 替代 `title` prop，然后在 `:deep(.ant-modal-header)` 设置 `padding: 16px 24px`（与 body padding 一致）
- **Bash tool 超时杀死前台进程**：在 Bash 工具里直接跑 `npm run dev` / `node server.js`，shell 超时后会回收整个进程组，导致服务被连带杀死。必须用 `nohup` 启动脱离进程组控制，或使用 `start.sh` 一键启动。lsof 确认：`lsof -i :5173 -i :3001`
- **playwright-cli 访问带 basic auth 的 dev server**：Vite 配置了 basic auth（admin/745544752），URL 需用 `http://user:pass@host/` 格式，但会触发 Vue Router `SecurityError: replaceState`（不影响渲染）。排查时先用 curl 验证 auth 是否生效
- **G2 v5 默认渲染到 Canvas 而非 SVG**：`querySelectorAll('svg')` 不适用于检查 G2 图表渲染，应通过 `canvas.getContext('2d').getImageData()` 或 `canvas.width` 验证
- **G2 柱状图数据要放在 interval mark 层级**：`chart.interval().data([...])` 而非 `chart.data([...])` + `chart.interval()`，后者会导致柱状图不渲染。折线图/面积图用 mark-level data 无此问题。参考 `ChartRenderer.vue` 模式
- **OBSDashboard 作为 App.vue dashboard-mode 的特殊页签**：通过判断 `currentDashboard.value?.title === 'OBS监控'` 条件渲染，需隐藏区域选择/导出/编辑/时间选择器/FAB/配置面板等通用工具条
- **`deepseek-ocr` 对 G2 Canvas 图表截图识别效果差**：OCR 模型会幻觉填充不存在的文字。UI 验证应优先用 playwright `eval` + snapshot 文本，而非截图后 OCR
- **sysinfo.sh JSON 输出用 `add_json` 函数而非 while-read 管道**：`echo -e "$OUT" | while IFS=':' read key val` 会在值含冒号/Docker 端口映射时截断。正确做法：用 shell 函数变量拼接，最后 `${json_parts%,}` 去尾逗号。参考 `006-vm/sysinfo.sh` 的 `add_json()` 模式
- **后端 JSON 数组字段无需前端 `JSON.parse()`**：`sysinfo.sh --json` 输出经后端 `res.json()` + 前端 `fetch().json()` 两次解析后，数组字段（`top_cpu_processes` / `disks` / `docker_containers` 等）已经是 JS 数组对象，再调用 `JSON.parse()` 会抛异常导致数据为空。应直接访问数组/对象属性。参考 `VMDashboard.vue` 的 `topCpu`/`topMem` computed 修复
- **Express 路由顺序：catch-all 中间件必须放最后**：`cmdbRouter` 挂载在 `/api/cmdb` 会捕获 `/:tableName` 参数，若将自定义 VM 端点放在 `/api/cmdb/vm/sysinfo` 会被路由到 cmdb 的 `:tableName` 导致"无效表名"。解法：将自定义端点移至独立路径（如 `/api/vm/sysinfo`）并在 `app.use('/api/cmdb', cmdbRouter)` 之前注册，同时添加 Vite proxy 配置
- **Vite proxy 新增后端路径需同步配置**：Express 新增端点（如 `/api/vm/*`）必须同时在 `vite.config.js` 的 `proxy` 中添加对应路径代理，否则 dev 模式前端请求 404
- **Dashboard slug 路由优于数字 ID**：独立链接使用 `/dashboard/vm` 而非 `/dashboard/6`，语义化且可读性更好。在 `useEditorState.js` 的 DASHBOARDS 中为每个 dashboard 加 `slug` 字段，路由 `/dashboard/:slug` 匹配，tab 点击用 `router.replace` 导航
- **自定义 Dashboard 组件的 toolbar 需自包含**：OBSDashboard/VMDashboard 等自定义组件不依赖 App.vue 的通用 toolbar，需自行实现刷新下拉、最后更新时间、时间范围选择等交互。App.vue 通过 `isCustomDashboard` computed 隐藏通用 toolbar/FAB/配置面板
- **G2 图表在小卡片中可用 `a-progress` 替代**：G2 环形图/柱状图在小卡片中空间利用率低且依赖 Canvas 渲染生命周期（destroy 防泄漏），改用 Ant Design Vue 的 `a-progress` 进度条更紧凑稳定，无需 chart 实例管理。参考 `VMDashboard.vue` 内存/磁盘使用卡片
- **AI Chat 后端重试应对空回复**：`/api/ai/chat` 请求 Agnes API 偶发返回 `choices[0].message.content = ""`（HTTP 200 但空内容）。后端需 for-loop 重试（最多 2 次，间隔 1s），不能假设非空即是正常。参考 `server.js` 的 `for (let i = 0; i <= 2; i++)` 模式
- **AI 回复推荐按钮格式 `[[action:...]]`**：用 `[[action:按钮文字:补充prompt]]` 标记可执行操作。后端正则 `/\[\[action:([^\]]+)\]\]/g` 解析剥离，`actions` 数组单独返回。前端渲染 `.action-btn`，`runAction()` 自动填入补充 prompt 发送。参考 `server.js` 和 `AIAssistant.vue`
- **前端 `data.reply` 空判需考虑 actions**：AI 回复可能 `reply=""` 但 `actions` 存在（AI 只输出 action 标记、无正文）。不能简单 `if (data.reply)` 判断不可用，需 `if (data.reply || data.actions?.length)`。后端也需兜底：reply 为空但有 actions 时生成 `推荐操作：xxx` fallback 文字
- **nohup 启动进程 PATH 不全**：`nohup` 启动的 Node 服务继承环境有限，`exec()` 子进程找不到 `sshpass`、`node` 等命令。解法：要么写死全路径（`/opt/homebrew/bin/sshpass`），要么在启动命令前 `export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"`。参考 `start.sh` 和 `server.js` 中 `sshpass` 使用
- **Node.js fetch 兼容性 workaround**：Node.js 22 的 undici 与某些外部 LLM API（如 Agnes）之间存在 TLS/网络兼容性问题，`fetch()` 会静默失败。用 `exec(curl)` 作为回退方案，JSON 体通过 `body.replace(/'/g, "'\\''")` 逃逸单引号后嵌入 shell 命令。参考 `server.js` 的 `/api/ai/chat` 路由

## NAS 监控项目

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

## 数据特点

- 所有 mock / seed 数据直接写在 views 文件中，无独立 mock 层
- CMDB API 基础路径 `/api/cmdb`，支持自动 CRUD + 分页排序过滤
- 首页使用 `useEditorState.js` 单例中的 `DASHBOARDS` / `CHARTS_DATA` 等配置数据

## 开发规范

- 后续所有回复使用**简体中文**
- 遵循 **Plan 模式**：理解需求 → 多轮验证 → 确认执行
- 遵循 **Karpathy Guidelines**：Think Before Coding、Simplicity First、Surgical Changes、Goal-Driven
- 功能完成后用 **Playwright** 测试验证（`npx playwright test`）
- 完整开发流程见 `开发文档.md`
