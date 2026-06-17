# AGENTS.md — Dashboard Editor

Vue 3 + Vite 运维监控系统。约 25 页面，5 大模块（首页/告警/监控/资源/运维/系统）。

## 命令

```bash
npm run dev         # Vite dev server (host 0.0.0.0, port 5173)
npm run build       # 构建 dist/
cd server && npm run dev  # Express 后端 (node --watch)
```

无 lint/typecheck/测试命令。SPA 需服务端配置 `createWebHistory()` fallback。

## Dev 注意事项

- Vite 内置 Basic Auth 中间件：`admin` / `745544752`
- API 代理：`/api/v1` → `http://192.168.0.155:9090`（`vite.config.js:28-34`）
- Font Awesome 6 通过 `index.html` CDN 引入（非 npm），请勿 npm install
- 无 Vuex/Pinia，全局状态用 `composables/useEditorState.js` 的 `reactive()` 单例

## 路由

`src/router/index.js` — 扁平 lazy-loaded routes + 3 组嵌套路由。

| 模块 | 嵌套 | 父容器 |
|---|---|---|
| OpsLogManageView `/ops/logs/*` | 10 子页 + 左树导航 | `OpsLogManageView.vue` |
| AccountView `/ops/account/*` | 17 子页 + 左树导航 | `AccountView.vue` |
| SecurityView `/system/security/*` | 9 子页 + 左树导航 | `SecurityView.vue` |
| SettingsView `/ops/settings/*` | 3 子页 + 左树导航 | `SettingsView.vue` |

`redirect` 不能与 `children` 同层级 → 用 `{ path: '', redirect: '...' }`。

## 布局约定

- 导航栏 `height: 48px`，子页内容 `calc(100vh - 48px)`
- 左侧导航宽 200px，右内容区 `padding: 24px`
- 嵌套路由父容器：sidebar + `<router-view />`，mobile 用 `a-select` 替代
- 全屏创建页：父容器加 `.create-mode` class（`padding: 0; overflow: hidden`）
- 详情页：父容器加 `.detail-mode` class（`padding: 0`），`detail-header` 在父层级渲染（height: 54px, bg: #fff）
- CSS 变量在 `App.vue:282-293` 定义（`--brand: #007DFF`, `--text`, `--border` 等）

### 列表页模板

```html
<div class="page-header"><h3>标题</h3></div>
<div class="filter-bar"><!-- a-select, a-range-picker, a-input-search --></div>
<a-table ... />
```

- 搜索框始终在 filter-bar 最右侧
- 新建按钮 right-aligned 用 `margin-left: auto`
- filter-bar 控件全部默认 32px（不加 `size="small"`）
- 间距：header→bar=16px, bar→table=16px, 内部 gap=8px

## 调试经验

### 页面空白排查 checklist

1. **先确认是 HMR 问题还是代码问题** — curl `http://admin:745544752@localhost:5173/src/views/xxx.vue` 看编译 JS 是否正常。如果 curl 返回正确但浏览器 DOM 为空，刷新页面（非 HMR）看是否恢复。HMR 可能静默失效，特别是大文件重写后。
2. **最小化还原法** — 不要一次性写完整组件。先写最简单的 `<a-table :columns="..." :data-source="..." />` 确认路由能渲染，然后逐步加功能。每一步都确认可渲染再加下一步。
3. **出问题时看 network 面板** — 浏览器是否真的发请求加载了该组件。如果 network 里没有该 `.vue` 的请求，说明组件根本没被加载（路由匹配失败或懒加载异常）。
4. **`a-table` 的 `:row-class-name`** — Ant Design Vue v4 签名是 `(record, index)`，不是 `({ record })`。解构写法会静默导致 render 失败，不报 console 错误。
5. **避免在 template 绑定中用箭头函数** — 某些 AntD 回调签名预期是普通函数。用 `function() {}` 比 `() => {}` 更安全。
6. **CSS 变量未定义不会报错** — `var(--bg-card)` 如果没定义，属性值退化为空字符串，可能导致背景透明但元素仍在。这不影响渲染，只影响视觉。
7. **position: fixed + overflow 的组合** — 如果父容器有 `overflow: auto/hidden`，`position: fixed` 子元素可能被裁剪。fixed 元素应挂在 body 层级或设置足够高的 z-index。

### Tab 间距计算
- `a-tabs` 与顶部间距：`.ant-tabs-nav` 的 `margin-top` 不能直接设为目标间距，因为 `.ant-tabs-tab` 自带 `padding-top: 12px`。
- 正确公式：`nav margin-top = 目标间距 - tab padding-top`。例如目标 16px → `margin-top: 4px`（4 + 12 = 16）。
- 父容器的 `padding-top` 不应参与间距，否则会叠加。应设 `padding-top: 0`，靠 tabs-nav 的 `margin-top` 统一管理。

### G2 5
- `chart.render()` 是 async — post-processing 必须 `.then()`
- 多 mark 去重：area/point 加 `.tooltip(false)`，仅 line 保留
- Tooltip 在 `overflow: auto` 内被裁剪 → `mount: 'body'` + `z-index: 9999`
- 环形图图例居中：`layout: { justifyContent: 'center' }`

### G6 v5
- `import { Graph } from '@antv/g6'`
- 无 `sourceAnchor`/`anchorPoints`（v4）。改用 **port 系统**：`ports: [{ key: 'top', placement: [0.5, 0], r: 0 }]`
- `getChildrenData(comboId)` 返回空 — 用 `getNodeData().filter(d => d.combo === id)`
- `graph.render()` 是 async
- 手动 grid 布局（勿用 dagre）：坐标放 `datum.style.x/y`，非顶层属性
- 连线用 `type: 'cubic-vertical'`，节点 `type: 'rect'` + FontAwesome `iconFontFamily: 'Font Awesome 6 Free'`

## Skills 安装规范

- 全局级别 skills 统一安装到 `~/.agents/skills/`，不要放其他目录
- 每个 SKILL.md 必须在 YAML frontmatter 中定义 `commands: [/xxx]` 字段，否则在 OpenCode GUI 中不显示为 `/command` 风格，只能靠 description 做 intent-based 自动匹配
- 安装新 skill 后需在下一次新会话中生效，无热加载

## 项目特点

- Ant Design Vue v4.2.6 全量引入（`main.js` 全局注册）
- 数据 mock 直接写死在 views 文件中，无独立 mock 层
- Server 端 Express + PostgreSQL + OpenAI（`server/server.js`）
- **CMDB**：`server/db/001_cmdb_schema.sql`（36 张表，覆盖 CI/IAM/告警/账号/日志/运维）
- **API 路由**：`server/routes/cmdb.js`，自动 CRUD + 特化端点（`ci/tree`, `alerts/stats`, `dashboard/overview`）
- seed 数据：`npm run seed`（`server/db/002_seed_data.sql`）
- `.opencode/` 在 `.gitignore` 中，不提交

## CMDB API

Base URL: `/api/cmdb`

| 端点 | 说明 |
|---|---|
| `GET /tables` | 列出所有 CMDB 表及列信息 |
| `GET /ci/tree` | CI 按类型分组树 |
| `GET /alerts/stats` | 告警统计摘要 |
| `GET /dashboard/overview` | 首页概览 KPI |
| `GET/POST/PUT/DELETE /:table` | 通用 CRUD |
| `GET /:table?key=val` | 按字段精确过滤 |
| `GET /:table?sort=col&order=DESC` | 排序 |
| `GET /:table?page=1&pageSize=50` | 分页 |

支持的表：ci_types, ci, users, alerts, accounts, jobs, operation_logs 等 36 张表。
