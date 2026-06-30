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

无 lint/typecheck/测试命令。SPA 需服务端 `createWebHistory()` fallback。

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

## 数据特点

- 所有 mock / seed 数据直接写在 views 文件中，无独立 mock 层
- CMDB API 基础路径 `/api/cmdb`，支持自动 CRUD + 分页排序过滤
- 首页使用 `useEditorState.js` 单例中的 `DASHBOARDS` / `CHARTS_DATA` 等配置数据
