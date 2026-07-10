# AI 运维优化方案

> 基于观测云智能监控架构的本地化落地

---

## 一、现状分析

### 1.1 当前 AI 能力

| 模块 | 现状 | 问题 |
|------|------|------|
| **AIAssistant.vue** | 浮动面板 + 聊天式交互，支持 `[[action:...]]` 推荐按钮 | 仅被动响应，无主动告警 |
| **后端 `/api/ai/chat`** | 双 Provider 兜底（ZhiPu GLM + Agnes），3 次重试 | 无本地数据增强，Prompt 为静态模板 |
| **数据源** | CMDB overview + alert stats + mock topology | 无实时指标、无日志、无链路数据 |
| **拓扑联动** | AI 回复提及节点时自动高亮 G6 图 | 仅 13 个 mock 节点，无真实服务拓扑 |
| **告警系统** | 静态阈值规则（`/api/mock/alerts`） | 无智能检测、无基线学习 |

### 1.2 观测云智能监控核心能力（对标）

| 能力 | 观测云方案 | 我们可借鉴点 |
|------|-----------|-------------|
| **主机智能检测** | 基于 ADTK 时序异常检测，自动学习 CPU/内存基线，识别突变/渐变异常 | 用 Z-Score + EWMA 替代硬阈值 |
| **日志智能检测** | 日志数量 + 错误日志数时序分析，自动发现日志风暴/突增 | 接入真实日志流，做聚类+时序分析 |
| **应用智能检测** | P90 耗时 + 错误请求数 + 请求数三维联合检测 | 从 Prometheus 拉取 APM 指标做分析 |
| **K8s 智能检测** | Pod/Node/Deployment 级别的资源异常+调度异常检测 | 复用现有 Portainer 数据 |
| **根因分析** | 异常事件 → 拓扑关联 → 依赖链分析 → 定位根因节点 | 增强 topology 为真实 CMDB 关系图 |
| **一键开启** | 无需配阈值，设检测范围+通知人即可 | 告警配置页增加"智能模式"开关 |

---

## 二、优化架构

```
┌─────────────────────────────────────────────────────┐
│                   前端 (Vue 3)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ AI Chat  │  │ 告警中心  │  │ 智能检测仪表板    │   │
│  │ 面板增强  │  │ 增强      │  │ (新增)           │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │                 │              │
│  ─────┴──────────────┴─────────────────┴───────────  │
│                    Express Backend                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ AI Chat  │  │ 智能检测  │  │ 告警引擎         │   │
│  │ +RAG增强 │  │ 引擎     │  │ (阈值+智能)      │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │                 │              │
│  ─────┴──────────────┴─────────────────┴───────────  │
│                    数据层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │Prometheus│  │ 日志存储  │  │ PostgreSQL CMDB  │   │
│  │ (已有)    │  │ (新增)   │  │ (已有)           │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 三、分阶段实施计划

### Phase 1：智能告警引擎（1-2 周）

**目标**：用统计算法替代硬编码阈值

#### 1.1 后端：智能检测引擎 `server/intelligent-monitor.js`

```javascript
// 核心算法：Z-Score 基线异常检测
class IntelligentDetector {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 60  // 基线窗口（分钟）
    this.sensitivity = options.sensitivity || 3  // Z-Score 阈值
    this.minSamples = options.minSamples || 10   // 最小样本数
  }

  // 计算基线（移动平均 + 标准差）
  baseline(timeseries) {
    const mean = timeseries.reduce((a, b) => a + b, 0) / timeseries.length
    const variance = timeseries.reduce((a, b) => a + (b - mean) ** 2, 0) / timeseries.length
    return { mean, std: Math.sqrt(variance) }
  }

  // 检测异常点
  detect(currentValue, historicalData) {
    if (historicalData.length < this.minSamples) return { isAnomaly: false, reason: 'insufficient_data' }
    const { mean, std } = this.baseline(historicalData)
    const zscore = std === 0 ? 0 : (currentValue - mean) / std
    const isAnomaly = Math.abs(zscore) > this.sensitivity
    return {
      isAnomaly,
      zscore: zscore.toFixed(2),
      baseline: mean.toFixed(2),
      deviation: `${((currentValue - mean) / mean * 100).toFixed(1)}%`,
      severity: Math.abs(zscore) > 5 ? 'critical' : Math.abs(zscore) > 3 ? 'warning' : 'info'
    }
  }

  // EWMA 趋势预测
  ewma(timeseries, alpha = 0.3) {
    let result = timeseries[0]
    for (let i = 1; i < timeseries.length; i++) {
      result = alpha * timeseries[i] + (1 - alpha) * result
    }
    return result
  }
}
```

#### 1.2 后端 API：智能检测端点

```
POST /api/intelligent/detect
Body: { metric: 'cpu_usage', target: 'host-001', range: '24h' }
Response: {
  current: 78.5,
  baseline: { mean: 45.2, std: 8.3 },
  isAnomaly: true,
  zscore: '3.99',
  severity: 'critical',
  suggestion: 'CPU 使用率超出基线 73%，建议检查进程 top_cpu_processes'
}

GET /api/intelligent/baselines?target=host-001&metrics=cpu_usage,mem_usage
Response: {
  cpu_usage: { mean: 45.2, std: 8.3, samples: 288, window: '24h' },
  mem_usage: { mean: 62.1, std: 5.7, samples: 288, window: '24h' }
}
```

#### 1.3 前端：告警中心增加智能模式

在 `ConfigView.vue` / `CustomizeView.vue` 中增加"检测模式"切换：

```
┌─────────────────────────────────────────┐
│ 检测模式: ○ 传统阈值  ● 智能基线       │
├─────────────────────────────────────────┤
│ 灵敏度: [低] [中] [高]                  │
│ 检测周期: [5分钟] [15分钟] [1小时]      │
│ 通知方式: [钉钉] [邮件] [站内]          │
│ 基线学习期: [7天] (首次开启需要)         │
└─────────────────────────────────────────┘
```

---

### Phase 2：AI 对话增强 — RAG 增强（2-3 周）

**目标**：让 AI 助手能基于真实数据回答问题

#### 2.1 后端：构建运维知识库 RAG

```javascript
// server/rag-pipeline.js
const CONTEXT_BUILDERS = {
  // 主机上下文
  host: async (hostId) => ({
    type: 'host',
    sysinfo: await fetchVMInfo(hostId),           // SSH 实时采集
    metrics: await queryPrometheus(`
      1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100,
      node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
    `),
    topProcesses: await getTopProcesses(hostId),
    recentAlerts: await getAlertsForHost(hostId)
  }),

  // 容器上下文
  container: async (containerId) => ({
    type: 'container',
    info: await getPortainerContainer(containerId),
    metrics: await queryPrometheus(`
      container_memory_usage_bytes,
      container_cpu_usage_seconds_total
    `),
    logs: await getRecentLogs(containerId, 100)
  }),

  // 服务拓扑上下文
  topology: async () => ({
    nodes: await getCMDBNodes(),
    edges: await getCMDBRelations(),
    anomalies: await detectTopologyAnomalies()
  })
}

// 构建增强 Prompt
function buildEnhancedPrompt(userMessage, contexts) {
  const systemParts = [
    '你是运维监控系统的 AI 助手，基于以下实时数据回答问题：',
    '',
    ...contexts.map(ctx => `## ${ctx.type} 数据\n\`\`\`json\n${JSON.stringify(ctx, null, 2)}\n\`\`\``),
    '',
    '## 回答要求',
    '- 基于数据事实回答，不要猜测',
    '- 如果数据不足，明确告知需要哪些信息',
    '- 给出可执行的运维建议',
    '- 使用 markdown 格式输出'
  ]
  return systemParts.join('\n')
}
```

#### 2.2 前端：AI 面板增强

```vue
<!-- AIAssistant.vue 新增功能 -->
<template>
  <!-- 1. 新增"场景化快捷操作" -->
  <div class="quick-scenarios">
    <a-button @click="analyzeCurrentPage">
      <i class="fa-solid fa-chart-line"></i> 分析当前页面
    </a-button>
    <a-button @click="diagnoseAlert">
      <i class="fa-solid fa-stethoscope"></i> 诊断告警
    </a-button>
    <a-button @click="predictAnomaly">
      <i class="fa-solid fa-crystal-ball"></i> 预测异常
    </a-button>
    <a-button @click="rootCauseAnalysis">
      <i class="fa-solid fa-search"></i> 根因分析
    </a-button>
  </div>

  <!-- 2. 新增"数据卡片"（嵌入对话） -->
  <div v-if="message.dataCards" class="data-cards">
    <MetricCard
      v-for="card in message.dataCards"
      :key="card.id"
      :title="card.title"
      :value="card.value"
      :trend="card.trend"
      :status="card.status"
    />
  </div>
</template>
```

#### 2.3 新增快捷场景

| 场景 | Prompt 模板 | 数据增强 |
|------|------------|---------|
| **诊断告警** | "分析告警 {alertId}，给出根因和处理建议" | 告警详情 + 同期指标 + 拓扑关系 |
| **预测异常** | "基于过去 24h 数据，预测未来 2h {metric} 趋势" | 时序数据 + EWMA 预测值 |
| **根因分析** | "分析 {service} 故障的根因链路" | 拓扑 + 依赖指标 + 日志 |
| **容量规划** | "按当前增速，{resource} 何时耗尽？" | 历史趋势 + 增长率计算 |

---

### Phase 3：智能检测仪表板（1 周）

**目标**：新增可视化页面展示智能检测结果

#### 3.1 新增路由和页面

```javascript
// router/index.js 新增
{
  path: '/monitor/intelligent',
  name: 'IntelligentMonitor',
  component: () => import('../views/monitor/IntelligentMonitorView.vue'),
  meta: { title: '智能检测', icon: 'fa-solid fa-brain' }
}
```

#### 3.2 页面布局

```
┌─────────────────────────────────────────────────────┐
│  智能检测仪表板                    [检测模式: 智能]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 主机异常 │ │ 服务异常 │ │ 日志异常 │ │ 容器异常 │  │
│  │   3     │ │   1     │ │   5     │ │   2     │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
├─────────────────────────────────────────────────────┤
│  异常事件时间线                                      │
│  ──●────●────────●──────────────────────●─────     │
│    │    │        │                      │           │
│  CPU  Memory   ResponseTime           DiskIO       │
├─────────────────────────────────────────────────────┤
│  实时异常列表                                        │
│  ┌────────┬──────────┬────────┬────────┬────────┐  │
│  │ 时间   │ 资源     │ 指标   │ 偏离度 │ 操作   │  │
│  ├────────┼──────────┼────────┼────────┼────────┤  │
│  │ 14:32  │ host-01  │ CPU    │ +156%  │ [AI分析]│  │
│  │ 14:28  │ web-app  │ P90    │ +89%   │ [AI分析]│  │
│  │ 14:15  │ mysql-db │ QPS    │ -67%   │ [AI分析]│  │
│  └────────┴──────────┴────────┴────────┴────────┘  │
└─────────────────────────────────────────────────────┘
```

---

### Phase 4：日志智能分析（2-3 周）

**目标**：接入真实日志流，实现聚类分析和异常检测

#### 4.1 后端：日志收集与分析

```javascript
// server/log-analyzer.js
class LogAnalyzer {
  // 日志聚类（基于模板提取）
  clusterLogs(logs) {
    const templates = {}
    for (const log of logs) {
      const template = this.extractTemplate(log.message)
      if (!templates[template]) {
        templates[template] = { count: 0, samples: [], firstSeen: log.timestamp }
      }
      templates[template].count++
      templates[template].samples.push(log)
      templates[template].lastSeen = log.timestamp
    }
    return Object.entries(templates)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([template, data]) => ({ template, ...data }))
  }

  // 提取日志模板（去除变量部分）
  extractTemplate(message) {
    return message
      .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, '<TIMESTAMP>')
      .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '<IP>')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>')
      .replace(/\b\d+\b/g, '<NUM>')
  }

  // 错误日志突增检测
  detectLogSpike(errorCounts, threshold = 2.5) {
    const { mean, std } = this.baseline(errorCounts.slice(0, -1))
    const current = errorCounts[errorCounts.length - 1]
    return {
      isSpike: current > mean + threshold * std,
      current,
      baseline: mean,
      ratio: (current / mean).toFixed(1)
    }
  }
}
```

#### 4.2 API 端点

```
POST /api/logs/analyze
Body: { source: 'nginx', range: '1h', type: 'cluster' }
Response: {
  total: 15420,
  clusters: [
    { template: 'GET /api/<NUM> <NUM>ms', count: 8234, pct: 53.4 },
    { template: 'ERROR: Connection <NUM> to <IP> failed', count: 234, pct: 1.5 },
    ...
  ],
  errorSpike: { detected: true, ratio: '3.2x' }
}
```

---

### Phase 5：根因分析引擎（3-4 周）

**目标**：告警发生时自动分析关联依赖，定位根因

#### 5.1 根因分析流程

```
告警触发
    │
    ▼
┌─────────────────┐
│ 1. 收集上下文    │ ← 指标 + 日志 + 拓扑 + 近期变更
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 时间对齐      │ ← 所有数据对齐到同一时间轴
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 关联分析      │ ← 找出同一时间窗口内的异常事件
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 拓扑溯源      │ ← 沿依赖链向上游追溯
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. AI 综合判断   │ ← LLM 结构化输出根因结论
└─────────────────┘
```

#### 5.2 AI 回复增强格式

```markdown
## 告警根因分析

### 异常事件
- **14:30** `web-app` P90 响应时间突增至 2.3s（基线 320ms）
- **14:29** `redis-cache` 连接数耗尽（512/512）
- **14:28** `mysql-db` 慢查询数激增

### 根因链路
```
web-app (P90↑) → redis-cache (连接耗尽) → mysql-db (慢查询↑)
                     ↑
              内存不足触发驱逐
```

### 根因判断
`redis-cache` 内存使用率达到 95%，触发 key 驱逐，导致缓存穿透，
大量请求直接打到 `mysql-db`，造成慢查询激增和上游 `web-app` 响应变慢。

### 建议操作
1. 立即：清理 redis 大 key（`[[action:清理 Redis 大 Key:分析 redis 大 key 并清理]]`）
2. 短期：增加 redis 内存配额（`[[action:扩容 Redis:生成 redis 内存扩容方案]]`）
3. 长期：优化缓存策略，增加本地缓存层
```

---

## 四、实施优先级与排期

| 阶段 | 内容 | 工时 | 优先级 | 依赖 |
|------|------|------|--------|------|
| **Phase 1** | 智能告警引擎 | 1-2 周 | P0 | 无 |
| **Phase 2** | AI RAG 增强 | 2-3 周 | P0 | Phase 1 数据 |
| **Phase 3** | 智能检测仪表板 | 1 周 | P1 | Phase 1 |
| **Phase 4** | 日志智能分析 | 2-3 周 | P1 | Phase 1 |
| **Phase 5** | 根因分析引擎 | 3-4 周 | P2 | Phase 1-4 |

---

## 五、技术选型建议

| 组件 | 方案 | 理由 |
|------|------|------|
| **时序异常检测** | 自实现 Z-Score + EWMA | 轻量，无需额外依赖，覆盖 80% 场景 |
| **日志聚类** | 正则模板提取 | 无外部依赖，适合结构化日志 |
| **AI 模型** | 复用 ZhiPu GLM + Agnes | 已有双 Provider 兜底 |
| **数据存储** | PostgreSQL JSONB | 复用现有 CMDB，新增 `detection_results` 表 |
| **前端图表** | G2 5（已有） | 复用现有 ChartRenderer 组件 |
| **实时推送** | SSE (Server-Sent Events) | 轻量，适合告警推送 |

---

## 六、数据库扩展

```sql
-- 智能检测基线表
CREATE TABLE detection_baselines (
  id SERIAL PRIMARY KEY,
  target_id VARCHAR(100) NOT NULL,      -- host-001 / web-app / redis-cache
  target_type VARCHAR(20) NOT NULL,     -- host / service / container
  metric_name VARCHAR(50) NOT NULL,     -- cpu_usage / p90_latency / error_count
  mean_value DOUBLE PRECISION,
  std_value DOUBLE PRECISION,
  sample_count INTEGER DEFAULT 0,
  window_minutes INTEGER DEFAULT 60,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(target_id, metric_name, window_minutes)
);

-- 智能检测事件表
CREATE TABLE detection_events (
  id SERIAL PRIMARY KEY,
  target_id VARCHAR(100) NOT NULL,
  metric_name VARCHAR(50) NOT NULL,
  current_value DOUBLE PRECISION,
  baseline_mean DOUBLE PRECISION,
  zscore DOUBLE PRECISION,
  severity VARCHAR(20),                 -- info / warning / critical
  root_cause TEXT,                      -- AI 分析的根因结论
  suggestion TEXT,                      -- AI 建议的操作
  status VARCHAR(20) DEFAULT 'open',    -- open / investigating / resolved
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- 检测配置表
CREATE TABLE detection_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  filter_condition JSONB,               -- { "hosts": ["host-001"], "metrics": ["cpu"] }
  sensitivity VARCHAR(10) DEFAULT 'medium',  -- low / medium / high
  check_interval_minutes INTEGER DEFAULT 5,
  notification_channels JSONB,          -- { "dingtalk": true, "email": true }
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 七、关键文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `server/server.js` | 修改 | 新增 `/api/intelligent/*` 路由 |
| `server/intelligent-monitor.js` | **新增** | 智能检测引擎核心 |
| `server/log-analyzer.js` | **新增** | 日志分析引擎 |
| `server/rag-pipeline.js` | **新增** | RAG 增强管道 |
| `src/views/monitor/IntelligentMonitorView.vue` | **新增** | 智能检测仪表板 |
| `src/views/alarm/ConfigView.vue` | 修改 | 增加智能模式切换 |
| `src/components/AIAssistant.vue` | 修改 | 增强场景化操作 |
| `src/composables/useEditorState.js` | 修改 | 新增检测状态管理 |
| `src/router/index.js` | 修改 | 新增智能检测路由 |

---

## 八、效果预期

| 指标 | 当前 | 优化后 |
|------|------|--------|
| 告警准确率 | ~60%（硬阈值） | ~85%（智能基线） |
| 误报率 | ~40% | ~15% |
| 平均发现时间 | 人工发现 | <5 分钟自动检测 |
| 根因定位 | 人工排查 30min+ | AI 辅助 <5 分钟 |
| AI 回复质量 | 通用回答 | 基于实时数据的专业回答 |

---

*文档版本：v1.0 | 创建日期：2026-07-10*
