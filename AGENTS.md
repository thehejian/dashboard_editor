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

## 关键框架 Quirks

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
- `.opencode/` 在 `.gitignore` 中，不提交
