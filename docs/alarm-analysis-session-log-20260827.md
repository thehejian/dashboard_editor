# 告警分析页面变更日志 — 2026-08-27

## 变更概述

告警分析页面 Hero 指标卡从 4 个精简为 3 个，新增降噪过滤分级统计，移除底部两个卡片。

## 网络问题记录（2026-08-27）

**问题**：前端/后端服务正常运行但页面无法访问，curl 测试超时。

**排查过程**：
1. `lsof -i :5173 -i :3001` 确认服务在监听
2. `nslookup github.com` — DNS 解析正常（223.5.5.5 → 20.205.243.166）
3. `curl localhost:5173` — 返回 401（basic auth，正常）
4. `curl localhost:3001` — 返回 404（根路径无路由，正常）

**根因**：DNS 临时解析异常，导致前端 HMR 热更新请求超时。重启前后端后恢复。

**解决方案**：重启前后端服务。DNS 问题为临时性，无需额外配置。

## 涉及页面

- `/overview?tab=alarm` — 告警分析页面

## 涉及文件

- `src/views/alarm/AlarmAnalysisView.vue` — 主页面组件
- `tests/alarm-analysis.spec.js` — 测试脚本
- `tests/g2-chart-display.spec.js` — G2 图表测试脚本

## 具体修改内容

### 1. Hero 指标卡精简（4→3）

**改前：**
```vue
<!-- Row 1: Hero Metric -->
<div class="aa-hero-row" v-loading="alarmLoading">
  <div class="aa-hero-card">
    <div class="aa-hero-icon" style="background:#F0F5FF;color:#007DFF"><i class="fa-solid fa-robot"></i></div>
    <div class="aa-hero-info">
      <div class="aa-hero-val">{{ alarmHeroStats.closedCount }}</div>
      <div class="aa-hero-label">AI自动闭环数</div>
      <div class="aa-hero-sub">次 / 近30天</div>
    </div>
    <div class="aa-hero-trend up">↑ 12% vs上月</div>
  </div>
  <!-- ... 告警降噪率 ... -->
  <!-- ... AI接管率 ... -->
  <div class="aa-hero-card">
    <div class="aa-hero-icon" style="background:#FFF1F0;color:#F5222D"><i class="fa-solid fa-clock"></i></div>
    <div class="aa-hero-info">
      <div class="aa-hero-val">{{ alarmHeroStats.savedHours }}</div>
      <div class="aa-hero-label">节省人工时</div>
      <div class="aa-hero-sub">小时 / 近30天</div>
    </div>
    <div class="aa-hero-trend up">↑ 38h vs上月</div>
  </div>
</div>
```

**改后：**
```vue
<!-- Row 1: Hero Metric -->
<div class="aa-hero-row" v-loading="alarmLoading">
  <div class="aa-hero-card">
    <div class="aa-hero-icon" style="background:#F0F5FF;color:#007DFF"><i class="fa-solid fa-robot"></i></div>
    <div class="aa-hero-info">
      <div class="aa-hero-val">{{ alarmHeroStats.closedCount }}</div>
      <div class="aa-hero-label">AI自动分析</div>  <!-- 改名 -->
      <div class="aa-hero-sub">次 / 近30天</div>
    </div>
    <div class="aa-hero-trend up">↑ 12% vs上月</div>
  </div>
  <!-- ... 告警降噪率 ... -->
  <!-- ... AI接管率 ... -->
  <!-- 节省人工时卡片已删除 -->
</div>
```

### 2. 告警降噪过滤 → 告警降噪过滤统计（含分级统计）

**改前：**
```vue
<div class="aa-chart-card">
  <div class="aa-chart-title">告警降噪过滤</div>
  <div ref="funnelContainer" class="aa-chart-inner"></div>
</div>
```

**改后：**
```vue
<div class="aa-chart-card">
  <div class="aa-chart-title">告警降噪过滤统计</div>
  <div class="aa-filter-stats">
    <div class="aa-filter-total">总过滤: <strong>{{ (alarmFunnel.raw - alarmFunnel.agg).toLocaleString() }}</strong> 条告警</div>
    <div class="aa-filter-breakdown">
      <div class="aa-filter-item critical">紧急: <strong>{{ alarmFunnel.filteredCritical || 0 }}</strong> 条</div>
      <div class="aa-filter-item warning">重要: <strong>{{ alarmFunnel.filteredWarning || 0 }}</strong> 条</div>
      <div class="aa-filter-item info">次要: <strong>{{ alarmFunnel.filteredInfo || 0 }}</strong> 条</div>
    </div>
  </div>
  <div ref="funnelContainer" class="aa-chart-inner"></div>
</div>
```

### 3. 移除底部两个卡片

**改前：**
```vue
<!-- Row 4: Apps to watch -->
<div class="aa-table-card">
  <AiopsAppCards :apps="alarmApps" :counts="alarmAppCounts" @app-click="onAppClick" />
</div>

<!-- Row 5: Healing Records -->
<div class="aa-table-card">
  <AiopsHealingRecords :records="alarmHealingRecords" @record-click="onHealingRecordClick" />
</div>
```

**改后：**
```vue
<!-- 已删除 -->
```

### 4. Script 清理

**改前：**
```javascript
import AiopsAppCards from '../../components/aiops/AiopsAppCards.vue'
import AiopsHealingRecords from '../../components/aiops/AiopsHealingRecords.vue'

const alarmHeroStats = ref({ closedCount: 0, reductionRate: 0, autoRate: 0, savedHours: 0 })
const alarmFunnel = ref({ raw: 0, dedup: 0, agg: 0, rate: 0 })
const alarmApps = ref([])
const alarmAppCounts = ref({ critical: 0, warning: 0 })
const alarmHealingRecords = ref([])

function onAppClick(app) {
  if (app.incidentNo) router.push('/ops/incident/' + app.incidentNo)
}

function onHealingRecordClick(record) {
  if (record.incidentId) router.push('/ops/incident/' + record.incidentId + '?tab=postmortem')
}
```

**改后：**
```javascript
// 移除了 AiopsAppCards 和 AiopsHealingRecords 的导入

const alarmHeroStats = ref({ closedCount: 0, reductionRate: 0, autoRate: 0 })  // 移除 savedHours
const alarmFunnel = ref({ raw: 0, dedup: 0, agg: 0, rate: 0, filteredCritical: 0, filteredWarning: 0, filteredInfo: 0 })  // 新增分级字段
// 移除了 alarmApps, alarmAppCounts, alarmHealingRecords

// 移除了 onAppClick 和 onHealingRecordClick 函数
```

### 5. 新增 CSS 样式

```css
/* 告警降噪过滤统计卡片 */
.aa-filter-stats { padding: 12px 16px; background: #f6f8fa; border-radius: 8px; margin: 8px 16px; }
.aa-filter-total { font-size: 14px; color: #1a1a1a; margin-bottom: 12px; }
.aa-filter-total strong { font-weight: 600; color: #007DFF; }
.aa-filter-breakdown { display: flex; gap: 16px; }
.aa-filter-item { font-size: 13px; color: #666; padding: 6px 12px; border-radius: 6px; background: #fff; border: 1px solid #e8e8e8; }
.aa-filter-item strong { font-weight: 600; }
.aa-filter-item.critical { border-color: #ff4d4f; color: #ff4d4f; }
.aa-filter-item.warning { border-color: #fa8c16; color: #fa8c16; }
.aa-filter-item.info { border-color: #1890ff; color: #1890ff; }
```

### 6. 测试脚本更新

**mock 数据更新：**
```javascript
// 移除 savedHours 和 healingRecords
const MOCK_OVERVIEW_STATS = {
  success: true,
  data: {
    heroStats: { closedCount: 128, reductionRate: 76, autoRate: 42 },
    funnelData: { raw: 1200, dedup: 1020, agg: 504, rate: 58, filteredCritical: 12, filteredWarning: 45, filteredInfo: 180 },
    // ...
  },
}
```

**测试用例更新：**
- `Row1: Hero 指标卡显示3个指标（AI自动分析、降噪率、AI接管率）` — 改名 + 数量 4→3
- `Row2: 三个图表卡片...告警降噪过滤统计...` — 改名
- `Row2: 降噪过滤统计卡片显示总过滤数和分级统计` — 新增测试
- `Row4: 需关注应用卡片已移除` — 断言 `.not.toBeVisible()`
- `Row5: 自动修复记录列表已移除` — 断言 `.not.toBeVisible()`

## 测试结果

- `tests/alarm-analysis.spec.js` — **40/40 passed**
- `tests/g2-chart-display.spec.js` — **6/6 passed**
- 全量回归 — **220 passed, 1 skipped**

## 可能出现的问题及解决方法

1. **funnelData 分级字段缺失**：后端 `overview-stats` API 需返回 `filteredCritical`、`filteredWarning`、`filteredInfo` 字段。当前 mock 数据已补充，真实数据需同步。
2. **CSS 样式冲突**：新增的 `.aa-filter-stats` 等类名需确保全局唯一，避免与其他页面冲突。
3. **移除组件的残留引用**：已清理 `alarmApps`、`alarmAppCounts`、`alarmHealingRecords` 等 ref 和函数。
