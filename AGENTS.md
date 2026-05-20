# AGENTS.md — Dashboard Editor

Vue 3 + Vite 运维监控系统。单页 → 多路由（~20 routes），Alarm/Monitor/Resource/Ops/System 五大模块 + Home 首页。

## 命令

```bash
npm run dev     # Vite 开发服务器 (host 0.0.0.0)
npm run build   # 构建 dist/
npm run preview
cd server && npm run dev  # Express 后端
```

无 lint/typecheck/测试命令。

## 路由结构

`src/router/index.js`: 扁平 lazy-loaded routes。
- `/` — HomeView.vue (首页 KPI + G2 图表 + 告警表格)
- `/alarm/realtime|history|config`
- `/monitor/dashboard|resource|config|topology`
- `/resource/list|topology|changes`
- `/ops/jobs|logs|inspect`
- `/system/security/*` — 嵌套路由，SecurityView.vue 带左树导航 + `<router-view>`。子路由用 `path: ''` + `redirect` 做默认页（redirect 不能与 children 同层级）
- `/system/config`
- `/system/users` — 重定向到 `/system/security`

## 目录

```
src/
├── composables/
│   ├── useEditorState.js   # reactive 单例 (仪表盘编辑器状态)
│   ├── usePrometheus.js    # Prometheus API 查询 + METRIC_PROMQL 映射
│   └── useExport.js        # html2canvas + jsPDF 导出
├── components/             # 编辑器组件 (ChartGrid, ConfigPanel, MultiSelect, ChartRenderer)
└── views/
    ├── HomeView.vue        # 首页
    ├── monitor/TopologyView.vue  # 云系统树 + G6 网络拓扑 (1164 lines)
    ├── security/IdpCreatePage.vue  # 独立全屏创建页 (非 Modal)
    └── security/IdpLdapForm.vue    # LDAP 配置表单 (6 折叠区块 + 三模式条件字段)
```

## 关键约定

### G2 5 (AntV)
- `chart.render()` 是 **async** — post-processing 必须 `.then()`
- 多 mark 去重：area/point 加 `.tooltip(false)`，仅 line 保留 `.tooltip({ title, items })`
- Tooltip 在 `overflow: auto` 容器内被裁剪 → `mount: 'body'` + `css: { '.g2-tooltip': { 'z-index': '9999' } }`（默认 z-index=8，侧滑面板 z-index=1050）
- 环形图图例居中：`layout: { justifyContent: 'center' }`（`itemAlign: 'center'` 无效）
- 完全移除轴：`chart.axis('x', false)`；保留轴：不调 `.axis()` 用默认

### G6 v5
- `import { Graph } from '@antv/g6'`
- **G6 v5 无 `sourceAnchor`/`targetAnchor`/`anchorPoints`**（v4 语法，被忽略）。改用 **port 系统**：node style 定义 `ports: [{ key: 'top', placement: [0.5, 0], r: 0 }]`（`r: 0` 不可见），edge data 设 `sourcePort: 'bottom'`/`targetPort: 'top'`
- `getChildrenData(comboId)` 返回空数组 → 用 `getNodeData().filter(d => d.combo === id)`
- `graph.render()` 是异步的，后处理必须在 `.then()` 内
- 网络拓扑勿用 dagre layout（手动 grid 更干净）：在 node data 的 `style` 中设 `x`/`y`（**不是**顶层属性），combo data 的 `style` 中设 `x`/`y`/`size`，不传 `layout` 参数
  - G6 v5 从 `datum.style.x / .y` 读取位置，顶层 `x`/`y` 会被忽略
  - combo size 需从子节点 bounds + padding 预计算：`min/max(x ± size/2)` + combo padding
  - 初次渲染后用 `graph.fitView({ padding: 20 })` 对齐画布
- 节点: `type: 'rect', size: [48, 48]` + FontAwesome `iconFontFamily: 'Font Awesome 6 Free'`
- 网络拓扑连线用 `type: 'cubic-vertical'`（垂直贝塞尔曲线，上下流向走优雅 S 弧）
- 内置 minimap 插件：`plugins: [{ type: 'minimap', size: [180, 140], padding: 10 }]`

### Vue Router
- `redirect` 不能与 `children` 同层级 → 用 `{ path: '', redirect: '...' }`

### API 代理
`vite.config.js`: `/api/v1` → `http://192.168.0.155:9090`

### 状态管理
`useEditorState.js` — `reactive()` 单例，所有组件 `useEditorState()` 共享同一 state。

### 侧滑面板
- 面板 top 必须与导航栏 height 一致（48px）
- Radio 按钮用 `v-model:value` + watch 重置
- 如果面板内 G2 tooltip 不显示 → `mount: 'body'` + 高 z-index
