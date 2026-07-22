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
