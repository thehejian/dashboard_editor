# 告警AI功能现状 vs AIOps设计文档 差距分析

> 分析日期：2026-08-21
> 参考文档：`docs/aiops-overview-design.md`

---

## 一、当前系统AI功能现状

### 1. 已实现的AI能力（均为本地mock，未接真实LLM）

| 功能点 | 位置 | 状态 | 备注 |
|--------|------|------|------|
| AI分析按钮（列表行内） | `RealtimeView.vue:74` | ✅ 已实现 | 紫色机器人图标，点击打开详情+切AI分析Tab |
| AI分析Tab（详情页） | `RealtimeView.vue:390` | ✅ 已实现 | mock分析结果（根因/影响面/建议/关联告警/置信度） |
| 智能检测Tab | `RealtimeView.vue:220` | ✅ 已实现 | 异常检测，调用 `/api/intelligent/anomalies` |
| 继续追问AI助手 | `RealtimeView.vue:1155` | ✅ 已实现 | `window.__openAIAssistant()` 跳转全局面板 |
| 锚定滚动 | `RealtimeView.vue:1060` | ✅ 已实现 | 切AI分析Tab后自动滚到合适位置 |

### 2. 后端现有AI相关接口（均为mock）

| 接口 | 作用 | 文件 |
|------|------|------|
| `GET /api/intelligent/anomalies` | 智能异常检测 | `server.js:794` |
| `GET /api/intelligent/health` | 健康度评分 | `server.js:808` |
| `GET /api/intelligent/predictions` | 预测 | `server.js:826` |
| `GET /api/intelligent/remediation` | 修复建议 | `server.js:835` |
| `GET /api/intelligent/baseline/:metric` | 基线数据 | `server.js:844` |
| `GET /api/intelligent/golden-signals` | 黄金指标 | `server.js:889` |
| `GET /api/intelligent/recommendations` | 推荐动作 | `server.js:933` |
| `GET /api/intelligent/incident-timeline` | 事件时间线 | `server.js:971` |

### 3. 现有概览页统计模块（4宫格）

| 模块 | 图表类型 | 数据来源 | 设计文档对应 |
|------|----------|----------|--------------|
| 级别统计 | 环形图（Donut） | `firingAlerts` | ✅ 模块3（告警总数与级别分布） |
| 告警状态 | 环形图（Donut，非Bar） | `firingAlerts` | ❌ 无对应 |
| 告警持续时长 | 横向Bar | `firingAlerts` TOP4 | ❌ 无对应 |
| TOP N 告警 | 纵向Bar | `firingAlerts` 指标频次 | ✅ 模块4（TopN告警类型）但维度不同 |

---

## 二、设计文档要求的5个模块 vs 现状差距

### 模块1：告警自动处理成果（Hero Metric）

| 设计文档要求 | 现状 | 差距 |
|-------------|------|------|
| AI自动闭环数（近30天） | ❌ 无此数据 | **需新增后端接口**：`GET /api/intelligent/ai-closed-alerts` |
| 节省人工时换算 | ❌ 无此数据 | 同上，或前端计算 |
| 数字卡片样式 | HomeView 有 KPI 卡（`kpiCards`）可复用 | 前端可参考 `HomeView.vue:162-174` 样式 |

### 模块2：告警降噪与聚合率

| 设计文档要求 | 现状 | 差距 |
|-------------|------|------|
| 原始告警数 | 可从历史告警表统计 | 需新增后端接口：`GET /api/cmdb/alerts/stats?group=by_day` |
| 聚合后事件数 | ❌ 无此数据（需Incident概念） | **需新建后端接口**：`GET /api/intelligent/incidents` |
| 降噪率计算 | ❌ 无此数据 | 后端计算或前端计算 |
| 漏斗图/对比进度条样式 | ❌ 未实现 | 需手写 G2 或使用 `ant-design-vue` Progress + 自定义布局 |

### 模块3：告警总数与级别分布

| 设计文档要求 | 现状 | 差距 |
|-------------|------|------|
| 当前未处理告警总数 | `firingAlerts.length` 已有 | ✅ 可复用 |
| 分级环形图（Critical/Major/Minor/Info） | 已有环形图（Critical/Warning/Info） | ⚠️ 级别映射需对齐（系统用 `critical/warning/info`，设计文档用 `致命/严重/一般/提示`） |
| 计数 | 无 | 需加数字标题 |

### 模块4：TopN告警类型

| 设计文档要求 | 现状 | 差距 |
|-------------|------|------|
| 按7大分类统计（容量/阈值/证书/硬件/网络/服务/合规） | ❌ 无此维度统计 | **需新增分类字段**：告警表增加 `category` 字段（或基于 metric 关键词自动分类） |
| 横向柱状图 | 现有 TOPN 是纵向 Bar，按指标名频次统计 | ⚠️ 维度不同，需改字段 |
| 指导基础设施优化 | 无此语义 | 需加说明文案 |

### 模块5：处理趋势与人机对比

| 设计文档要求 | 现状 | 差距 |
|-------------|------|------|
| AI自动处理趋势线（天/周） | ❌ 无此数据 | **需新增后端接口**：`GET /api/intelligent/ai-processing-trend` |
| 人工闭环趋势线 | 可从 resolved 告警统计 | 需按处理人统计 |
| 双线面积图 | ❌ 未实现 | 需手写 G2 area chart |

---

## 三、设计文档架构层 vs 当前实现映射

### 1. 告警分类体系（设计文档1.0）

设计文档定义了7大类：
- 容量类 (Capacity)
- 阈值/性能类 (Performance)  
- 证书/安全类 (Security)
- 硬件/底座故障类 (Hardware)
- 网络连接类 (Network)
- 服务/应用状态类 (Service)
- 配置合规类 (Compliance)

**现状映射**：
- 当前告警的 `metric` 字段只包含具体指标名（如 `CPU使用率`、`磁盘使用率`），**没有分类字段**
- `buildAiAnalysis()` 函数（`RealtimeView.vue:1090`）已有基于 metric 关键词的分类逻辑：
  ```js
  { re: /cpu|处理器/, cat: 'CPU' },
  { re: /内存|redis|堆|连接数/, cat: '内存' },
  { re: /磁盘|inode/, cat: '磁盘' },
  { re: /复制延迟|主从|mysql|db|查询|sql/, cat: '数据库' },
  { re: /丢包|网络|带宽|流量/, cat: '网络' },
  // 其他归为 '其他'
  ```
- **差距**：分类粒度不够（缺少证书/安全/硬件/服务/合规类）

### 2. 告警聚合处理（设计文档2.0）

| 设计文档能力 | 现状 | 差距 |
|-------------|------|------|
| 时间与频次聚合 | ❌ 无 | 需后端定时任务去重静默 |
| 拓扑/血缘聚合 | ❌ 无 | 需CMDB拓扑数据支持 |
| 语义与时序关联（NLP聚类） | ❌ 无 | 需LLM能力 |

### 3. AI Agent自动修复（设计文档3.0）

| 设计文档能力 | 现状 | 差距 |
|-------------|------|------|
| 自动修复-磁盘满 | ❌ 无 | 需Agent执行API/脚本 |
| 自动修复-证书过期 | ❌ 无 | 同上 |
| 自动修复-进程僵死 | ❌ 无 | 同上 |
| RAG知识库检索 | ❌ 无 | 需接RAG pipeline |
| 根因分析(RCA) | ⚠️ 部分（mock） | 现是规则引擎，非LLM |
| 处置建议生成 | ⚠️ 部分（mock） | 现有建议来自 expData 模板，非动态生成 |

---

## 四、实施优先级建议

### Phase 1：概览页数据层（后端优先）

| 优先级 | 模块 | 工作量 | 关键接口 |
|--------|------|--------|----------|
| P0 | 模块1 Hero Metric | 中 | `GET /api/intelligent/ai-closed-alerts` |
| P0 | 模块2 降噪率 | 高 | `GET /api/intelligent/incidents` + 原始告警统计 |
| P0 | 模块5 趋势对比 | 高 | `GET /api/intelligent/processing-trend` |
| P1 | 模块4 TopN分类 | 中 | 告警表增加 `category` 字段 + 统计接口 |

### Phase 2：前端UI改造

| 优先级 | 内容 | 改动点 |
|--------|------|--------|
| P0 | 替换 4 宫格统计为 5 模块布局 | `RealtimeView.vue:6-23` stats-row |
| P1 | 新增数字 KPI 卡片组件 | 参考 `HomeView.vue:162-174` kpiCards 样式 |
| P1 | 新增漏斗图/对比进度条 | 手写 G2 或 antd Progress |
| P2 | 新增双线面积图 | G2 area chart |

### Phase 3：架构能力补齐

| 优先级 | 内容 | 依赖 |
|--------|------|------|
| P2 | 告警分类字段标准化 | 后端 schema 变更 + seed 数据 |
| P2 | 告警聚合去重逻辑 | 后端定时任务 |
| P3 | LLM 接入（替换 mock） | `.env` 配置 + `server.js` 改造 |
| P3 | RAG 知识库 | 独立模块 |

---

## 五、复用/改造建议

### 可复用代码
- `buildAiAnalysis()` 的分类逻辑 → 可扩展为告警分类标准
- `window.__openAIAssistant()` → AI助手入口，全局复用
- `HomeView.vue` 的 KPI 卡片样式 → 概览页 Hero Metric
- G2 图表模式 → 所有新图表都可用此模式

### 需新建
- 新的后端统计接口（概览页 5 模块所需数据）
- 漏斗图组件（G2 或 HTML/CSS）
- 双线面积图（G2 area）
- 告警分类字段（schema + 分类逻辑）

### 需调整
- 当前 `stats-row` 4宫格布局 → 改为新5模块布局
- `firingAlerts` 数据来源 → 增加分类维度
- 级别名称映射（`critical/warning/info` → `致命/严重/一般/提示`）

---

## 六、总结

| 维度 | 评价 |
|------|------|
| AI分析能力 | ✅ 已实现（列表+详情，mock），链路完整 |
| 概览页数据 | ❌ 缺乏AI ROI 指标（闭环数、降噪率、趋势对比） |
| 告警分类 | ⚠️ 有部分分类逻辑，但未标准化为7大类 |
| 聚合降噪 | ❌ 未实现 |
| 自动修复 | ❌ 未实现 |
| LLM接入 | ❌ 仍为mock |

**核心结论**：当前告警页已有"AI分析"入口（单条告警视角），但缺少"AI运维成效"的**全局指标视图**。设计文档的5个模块聚焦于 ROI 展示，需要新增后端统计接口 + 前端布局改造。建议先从 P0 的数据接口入手，再改 UI。
