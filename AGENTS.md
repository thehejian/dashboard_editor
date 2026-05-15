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

## 开发命令

```bash
npm run dev     # 启动开发服务器 (热更新)
npm run build   # 构建到 dist/
npm run preview # 预览构建产物
```

## API 代理

在 `vite.config.js` 中配置，代理 `/api/v1` 到后端服务。

## 移动端注意

- 使用 `100dvh` 替代 `100vh` 解决移动端底部安全区域
- ConfigPanel 移动端需设 `top: 0` 使底部按钮固定

## 参考文档

- `document/01-参考.txt` — 监控系统架构设计说明
- `document/03-图表推荐逻辑.md` — 图表推荐逻辑详解
- `开发文档.md` — 完整技术文档
