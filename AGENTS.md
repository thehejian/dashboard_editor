# AGENTS.md - Dashboard Editor

## 项目概况

Vue 3 + Vite 仪表盘编辑器。迁移自单文件 HTML，使用 Composition API + reactive 状态管理。

## 项目结构

```
├── index.html                     # Vite 入口
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                    # 挂载 Vue 应用
│   ├── App.vue                    # 主布局 + 全局 CSS
│   ├── composables/
│   │   └── useEditorState.js      # 全部状态 + 业务逻辑
│   └── components/
│       ├── ChartGrid.vue          # 图表网格 (v-for + 添加卡片)
│       ├── ConfigPanel.vue        # 配置面板 (数据/样式 Tab)
│       └── MultiSelect.vue        # 通用多选下拉 (搜索+checkbox)
```

## 关键设计

- **状态管理**: `reactive()` 单例在 `useEditorState.js` 中，所有组件 `useEditorState()` 共享同一 state
- **模板绑定**: 用 `v-model` 替代 `innerHTML + getElementById`，`@click` 替代 `onclick`
- **三级级联**: `CASCADE[type][index].items[subIndex]` → `metrics[]`
- **CSS**: 华为 HarmonyOS light theme，`<style>` 全局 + `<style scoped>` 组件级

## 配置面板行为

| Tab | 区块 | 备注 |
|-----|------|------|
| 数据 | 数据集 | radio: 按分组/按资源类型, 级联更新指标列表; 三级结构: 分类→子数据集→指标 |
| 数据 | 统计周期 | 含"实时当前值", 默认 24h; 当前值模式推荐数值图, 趋势模式按指标类型推荐 |
| 数据 | 采集周期 | 默认 1m |
| 数据 | 监控指标 | MultiSelect 组件, 多选 + 搜索过滤 |
| 数据 | 监控对象 | radio: 全部资源(聚合+TopN) / 资源分组 / 指定资源 |
| 数据 | 推荐图表 | 当前值模式→数值图优先; 趋势模式按 `METRIC_REC` 映射推荐, 支持 metric→chart 映射 |
| 样式 | 基础信息 | 名称/所属分组/备注 (textarea) |
| 样式 | 图例 | radio: 不显示/顶部/底部/右侧 |
| 样式 | 阈值 | 动态行: value input + radio 四色(紧急红/重要橙/次要黄/提示蓝) |
| 样式 | 链接 | toggle 控制 URL 输入 + 图表标题 ↗ 图标 |

## 约定与陷阱

- 阈值数据通过 `updateThValue` / `updateThLevel` 实时写入 `ch.thresholds[]`
- SVG 图表渲染在 `renderChartSVG(type, color)` 中, 使用 `v-html` 插入
- 图表标题的链接图标在 ChartGrid.vue 中根据 `ch.linkEnabled` 条件渲染
- 级联数据定义在 `CASCADE` 对象: `group[]` 和 `resource[]` 两个入口; 三级结构: category → items[] → metrics[]
- 顶部导航点击跳转到具体图表: 使用 `data-chart-id` 属性 + `scrollIntoView`
- 画布不分组, 导航下拉列出所有图表标题

## 技术栈

- Vue 3 ^3.5 + Vite ^6.3
- Ant Design Vue ^4.2.6
- AntV G2 ^5.4.8
- vue-router ^4.6.4 (路由 + 多视图)
- vuedraggable ^4.1.0 (拖拽排序)
- html2canvas + jspdf (导出 PDF)
- 后端: Express + PostgreSQL + OpenAI (server/ 目录)

## 项目结构

```
src/
├── main.js              # 入口
├── App.vue              # 布局 + 路由出口
├── router.js            # 路由配置
├── composables/
│   └── useEditorState.js # 核心状态 (editor 逻辑)
├── components/          # 通用组件 (ChartGrid, ConfigPanel, MultiSelect, ChartRenderer)
└── views/               # 页面视图
    ├── MonitorView.vue      # 监控大屏 (主入口)
    ├── AlarmView.vue       # 告警中心
    ├── OpsView.vue         # 运维中心
    ├── ResourceView.vue    # 资产管理
    └── system/*.vue        # 系统配置
```

## 开发命令

```bash
npm run dev     # 启动 Vite 开发服务器 (热更新, host: 0.0.0.0)
npm run build   # 构建到 dist/
npm run preview # 预览构建产物
cd server && npm run dev  # 启动后端 (Express)
```

## API 代理

`vite.config.js` 代理 `/api/v1` → `http://192.168.0.155:9090`

## 移动端注意

- 使用 `100dvh` 替代 `100vh` 解决移动端底部安全区域
- ConfigPanel 移动端需设 `top: 0` 使底部按钮固定

## 参考文档

- `document/01-参考.txt` — 监控系统架构设计说明
- `document/03-图表推荐逻辑.md` — 图表推荐逻辑详解
- `开发文档.md` — 完整技术文档
- `项目避坑指南.md` — 项目常见问题汇总
- `样式修改建议-P10.md` — UI 样式规范

## 样式排查经验

### 卡片高度对齐问题

- **KPI 卡片高度不一致**：有 sub 值的卡片比没有的高 → 给所有卡片统一添加空 sub 行 `sub: ' '`，并给 `.card-sub` 设置 `min-height: 16px`
- **两个图表卡片高度不一致**：环形图比折线图低 → 调整环形图 `padding` 和图表内部 `min-height`，逐像素调试至一致
- **方法**：先确定目标高度，再分别调整各元素的 padding/margin/min-height 填充至目标

### 卡片间距问题

- **Ant Design Vue 的 a-row gutter 已经控制间距**：gutter 设为 16px，子卡片不需要再写 margin（margin-bottom/margin-top），否则间距会变成 32px（2倍）
- **统一由 gutter 控制**：所有卡片之间的上下左右间距都通过 a-row 的 gutter 属性设置

### Radio 按钮问题

- **Ant Design Vue 的 a-radio-group 在侧滑面板中无法选中**：使用 `v-model:value` 替代 `v-model`，并添加 watch 在面板打开时强制重置选中值
- **z-index 问题**：侧滑面板使用高 z-index 时，内部 Radio 按钮需要增加 `position: relative; z-index: 1` 样式确保可点击

### AntV G2 图表卡片高度调试

- **问题**：G2 图表渲染高度与 SVG 不同，导致两个卡片高度不一致
- **排查步骤**：
  1. 检查卡片容器 min-height 是否一致
  2. 检查图表内容区（donut-chart / line-chart）的 padding 和 height
  3. 调整 G2 图表的 height 和 padding 参数
  4. 检查 ant-card-body 的高度计算是否正确（calc(100% - 57px)）
- **方法**：先用浏览器开发者工具确定目标高度，再微调各元素参数至一致

### G2 图表图例换行问题

- **G2 底部图例一屏展示不下**：图例项过多时，G2 底部图例会换行导致布局错乱
- **修复**：通过 `padding` 参数缩小图表左右边距来增加绘图区宽度，为底部图例提供足够空间；同时移除老式 SVG 图表遗留的 `padding-left: 70px` 容器样式

### 告警事件详情侧滑面板

- **触发方式**：表格行内的"查看详情"按钮点击 → `openAlertEventDetail(record)` → 设置 `alertEventRecord` → 面板展示告警事件详情内容
- **面板复用**：使用同一个 detail-panel，通过 `alertEventRecord` 判断展示模式（`v-if="!alertEventRecord"` 显示正常面板内容，`v-else` 显示告警事件详情）
- **布局结构**：摘要卡片（级别标签+事件名称+时间）→ CI属性信息表（4行4列网格）→ 处理历史时间轴（CSS 垂直虚线+红/黄圆点）→ 底部操作按钮（关闭+处理告警）
- **关闭处理**：`closeDetailPanel` 同时重置 `alertEventRecord.value = null`，关闭后恢复为正常面板
- **注意**：不要在 `v-if`/`v-else-if` 链中混用 `v-else-if` 和独立 `v-if` 作为兄弟元素，需要使用 `v-else-if` 链的首个必须是 `v-if`，后续同链使用 `v-else-if`
