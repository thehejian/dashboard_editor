# 告警分析页面完整复刻指南

> 基于 Vue 3.5 + Vite 6.3 + Ant Design Vue 4.2.6 运维监控系统  
> 文档时间：2026-08-25  
> 覆盖范围：告警分析主页、故障详情页、实时告警页、Drawer 重构、告警级别/状态统一

---

## 目录

1. [变更总览](#1-变更总览)
2. [前端修改 — AlarmAnalysisView.vue](#2-前端修改--alarmanalysisviewvue)
3. [前端修改 — AlarmDetailView.vue](#3-前端修改--alarmdetailviewvue)
4. [前端修改 — RealtimeView.vue](#4-前端修改--realtimeviewvue)
5. [前端修改 — CustomizeView.vue](#5-前端修改--customizeviewvue)
6. [后端修改 — server.js](#6-后端修改--serverjs)
7. [后端修改 — mockData.js](#7-后端修改--mockdatajs)
8. [后端修改 — routes/cmdb.js](#8-后端修改--routescmdbjs)
9. [测试修改 — alarm-analysis.spec.js](#9-测试修改--alarm-analysisspecjs)
10. [告警级别体系](#10-告警级别体系)
11. [告警状态体系](#11-告警状态体系)
12. [Drawer 重构](#12-drawer-重构)
13. [踩坑清单](#13-踩坑清单)
14. [数据结构参考](#14-数据结构参考)
15. [还原检查清单](#15-还原检查清单)

---

## 1. 变更总览

### 1.1 涉及文件清单

| # | 文件路径 | 类型 | 改动行数 | 说明 |
|---|---|---|---|---|
| 1 | `src/views/alarm/AlarmAnalysisView.vue` | 前端 | +224/-97 | 主页面：Drawer重构、级别/状态统一、列宽调整 |
| 2 | `src/views/alarm/AlarmDetailView.vue` | 前端 | +6/-6 | 详情页：级别/状态文字统一 |
| 3 | `src/views/alarm/RealtimeView.vue` | 前端 | +116/-16 | 实时告警：Intelligence Tab级别统一、状态统一 |
| 4 | `src/views/alarm/CustomizeView.vue` | 前端 | +2/-2 | 列设置描述文字更新 |
| 5 | `server/server.js` | 后端 | +434/-0 | MOCK_INCIDENTS、API端点、降噪数据、分类策略 |
| 6 | `server/db/mockData.js` | 后端 | +25/-0 | 新增4条告警（硬件/网络/配置类） |
| 7 | `server/routes/cmdb.js` | 后端 | +25/-0 | AI测试告警动态时间戳 |
| 8 | `tests/alarm-analysis.spec.js` | 测试 | +90/-0 | 39个测试用例（28+7故事线+4分类视图） |
| 9 | `AGENTS.md` | 文档 | +37/-0 | 经验教训、NAS配置、SRE故障中心 |
| 10 | `docs/alarm-analysis-session-log-20260824.md` | 文档 | +204/-0 | 变更记录 |

### 1.2 核心改动摘要

```
1. Drawer 重构
   - 两个 Drawer（降噪详情 + 关联告警）合并为一个"告警详情"
   - 降噪概览从三步流程图压缩为一行式
   - 新增已过滤告警折叠区
   - 标题改为"告警详情"

2. 告警级别统一
   - critical → 紧急（红色）
   - warning  → 重要（橙色）
   - info     → 次要（蓝色）
   - 去掉 P1/P2/P3 前缀

3. 告警状态统一
   - firing → 待处理（原"告警中"）
   - resolved → 已恢复/已闭环
   - suppressed → 已屏蔽

4. 表格列宽调整
   - 告警名称固定 150px + ellipsis
   - 操作列合并（AI分析 + 详情）
```

---

## 2. 前端修改 — AlarmAnalysisView.vue

### 2.1 告警级别标签（主表格 L108）

**改前：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : 'orange'">
  {{ { critical: 'P1紧急', warning: 'P2重要', info: 'P3提示' }[record.level] || record.level }}
</a-tag>
```

**改后：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">
  {{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}
</a-tag>
```

**要点：**
- info 级别颜色从 orange（错误地 fallthrough）改为 blue
- 去掉 P1/P2/P3 前缀，只保留中文

### 2.2 告警状态标签（Drawer 关联告警表格 L223）

**改前：**
```html
{{ record.status === 'firing' ? '告警中' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
```

**改后：**
```html
{{ record.status === 'firing' ? '待处理' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
```

### 2.3 Drawer 关联告警表格级别标签（L217-218）

**改前：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'default'" size="small">
  {{ { critical: 'P1', warning: 'P2', info: 'P3' }[record.level] || record.level }}
</a-tag>
```

**改后：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'" size="small">
  {{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}
</a-tag>
```

### 2.4 Drawer 已过滤告警级别标签（L241-242）

同 2.3，将 P1/P2/P3 改为 紧急/重要/次要，default 改为 blue。

### 2.5 Drawer 标题

**改前：**
```html
<a-drawer title="关联告警" ...>
```

**改后：**
```html
<a-drawer title="告警详情" ...>
```

### 2.6 Drawer 降噪概览（重构为一行式）

**改前（三步流程图）：**
```html
<div class="rd-overview">
  <div class="rd-overview-title"><i class="fa-solid fa-chart-line"></i> 降噪概览</div>
  <div class="rd-overview-flow">
    <div class="rd-overview-step">
      <div class="rd-overview-step-val">{{ relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count }}</div>
      <div class="rd-overview-step-label">原始告警</div>
    </div>
    <div class="rd-overview-arrow"><i class="fa-solid fa-arrow-right"></i></div>
    <div class="rd-overview-step">
      <div class="rd-overview-step-val">{{ relatedDrawerRecord.affected_count }}</div>
      <div class="rd-overview-step-label">关联告警</div>
    </div>
    <div class="rd-overview-arrow"><i class="fa-solid fa-arrow-right"></i></div>
    <div class="rd-overview-step">
      <div class="rd-overview-step-val">{{ relatedDrawerRecord.noise_reduction || 0 }}%</div>
      <div class="rd-overview-step-label">降噪率</div>
    </div>
  </div>
</div>
```

**改后（紧凑一行式）：**
```html
<div class="rd-overview">
  <div class="rd-overview-main">
    <span class="rd-overview-label">降噪</span>
    <span class="rd-overview-flow-text">{{ relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count }} → {{ relatedDrawerRecord.affected_count }}</span>
    <span class="rd-overview-sep">|</span>
    <span class="rd-overview-label">降噪率</span>
    <span class="rd-overview-rate" :style="{ color: (relatedDrawerRecord.noise_reduction || 0) >= 80 ? '#52c41a' : (relatedDrawerRecord.noise_reduction || 0) >= 50 ? '#1890ff' : '#faad14' }">{{ relatedDrawerRecord.noise_reduction || 0 }}%</span>
  </div>
  <div class="rd-overview-rules">
    <span class="rd-overview-rules-label">规则</span>
    <span class="rd-overview-rule">同metric聚合(5min)</span>
    <span class="rd-overview-rule">重复触发过滤</span>
  </div>
</div>
```

**CSS 样式：**
```css
.rd-overview { background: #f6f8fa; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
.rd-overview-main { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #1a1a1a; }
.rd-overview-label { color: #8c8c8c; font-size: 13px; }
.rd-overview-flow-text { font-weight: 600; font-size: 16px; }
.rd-overview-sep { color: #d9d9d9; margin: 0 4px; }
.rd-overview-rate { font-weight: 700; font-size: 18px; }
.rd-overview-rules { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; font-size: 13px; color: #8c8c8c; }
.rd-overview-rules-label { color: #595959; font-weight: 500; }
.rd-overview-rule { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
```

### 2.7 已过滤告警折叠区

```html
<div class="rd-filtered-section" v-if="(relatedDrawerRecord.raw_count || 0) > relatedDrawerRecord.affected_count">
  <div class="rd-filtered-toggle" @click="filteredAlertVisible = !filteredAlertVisible">
    <i class="fa-solid" :class="filteredAlertVisible ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
    已过滤告警 ({{ (relatedDrawerRecord.raw_count || relatedDrawerRecord.affected_count) - relatedDrawerRecord.affected_count }}条)
  </div>
  <div v-if="filteredAlertVisible" class="rd-filtered-list">
    <div v-for="(alert, idx) in generateFilteredAlerts(relatedDrawerRecord)" :key="idx" class="rd-filtered-item">
      <a-tag :color="alert.level === 'critical' ? 'red' : alert.level === 'warning' ? 'orange' : 'blue'" size="small">
        {{ { critical: '紧急', warning: '重要', info: '次要' }[alert.level] || alert.level }}
      </a-tag>
      <span class="rd-filtered-title">{{ alert.title }}</span>
      <span class="rd-filtered-reason">{{ alert.reason }}</span>
    </div>
  </div>
</div>
```

**JS 函数：**
```js
const filteredAlertVisible = ref(false)

function generateFilteredAlerts(record) {
  const raw = record.raw_count || record.affected_count
  const kept = record.affected_count
  const filteredCount = raw - kept
  if (filteredCount <= 0) return []
  const reasons = ['同metric去重', '1h内未达聚合阈值', '已屏蔽告警', '重复触发过滤']
  const alerts = []
  const relatedTitles = (record.related_alerts || []).map(a => a.title)
  for (let i = 0; i < Math.min(filteredCount, 6); i++) {
    alerts.push({
      level: i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'warning' : 'info',
      title: relatedTitles[i % relatedTitles.length] || '告警 #' + (kept + i + 1),
      reason: reasons[i % reasons.length],
    })
  }
  return alerts
}
```

### 2.8 表格列宽调整

**改前：**
```js
const relatedAlertColumns = [
  { title: '级别', key: 'level', width: 60 },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', width: 100, ellipsis: true },
  { title: '状态', key: 'status', width: 60 },
  { title: '触发时间', dataIndex: 'trigger_time', key: 'trigger_time', width: 120 },
  { title: '操作', key: 'action', width: 60 },
  { title: '查看详情', key: 'detail', width: 70 },
]
```

**改后：**
```js
const relatedAlertColumns = [
  { title: '级别', key: 'level', width: 50 },
  { title: '告警名称', dataIndex: 'title', key: 'title', width: 150, ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', width: 80, ellipsis: true },
  { title: '状态', key: 'status', width: 50 },
  { title: '触发时间', dataIndex: 'trigger_time', key: 'trigger_time', width: 90 },
  { title: '操作', key: 'ops', width: 70, fixed: 'right' },
]
```

**操作列模板（合并 AI分析 + 详情）：**
```html
<template v-if="column.key === 'ops'">
  <a class="aa-table-link" @click="router.push('/ops/incident/' + (record.incident_id || relatedDrawerRecord.incident_no))">AI分析</a>
  <a class="aa-table-link" @click="router.push('/alarm/current?alertId=' + record.id)" style="margin-left:6px">详情</a>
</template>
```

### 2.9 noise-reduction 单元格入口统一

**改前：**
```html
<div class="noise-reduction-cell" @click.stop="openNoiseReductionDrawer(record)" style="cursor:pointer">
```

**改后：**
```html
<div class="noise-reduction-cell" @click.stop="openRelatedDrawer(record)" style="cursor:pointer">
```

**原因：** 两个 Drawer 合并后，降噪率数字点击也打开同一个 Drawer。

### 2.10 删除旧降噪 Drawer

删除了以下模板和 JS：

**删除的模板（原 L267-319）：**
```html
<!-- Noise Reduction Detail Drawer — 整段删除 -->
<a-drawer :open="noiseDrawerVisible" title="降噪处理详情" ...>
  ...
</a-drawer>
```

**删除的 JS：**
```js
const noiseDrawerVisible = ref(false)
const noiseDrawerRecord = ref(null)
function openNoiseReductionDrawer(record) {
  noiseDrawerRecord.value = record
  noiseDrawerVisible.value = true
}
```

**删除的 CSS（14个类）：**
```css
.noise-drawer-overview, .noise-drawer-stat, .noise-drawer-stat-label,
.noise-drawer-stat-val, .noise-drawer-arrow, .noise-drawer-section,
.noise-drawer-section-title, .noise-drawer-rules, .noise-drawer-rule,
.noise-drawer-alert-list, .noise-drawer-alert-item, .noise-drawer-alert-title,
.noise-drawer-alert-resource, .noise-drawer-alert-more
```

### 2.11 完整 CSS 样式清单

```css
/* 统一 Drawer 样式 */
.rd-overview { background: #f6f8fa; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
.rd-overview-main { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #1a1a1a; }
.rd-overview-label { color: #8c8c8c; font-size: 13px; }
.rd-overview-flow-text { font-weight: 600; font-size: 16px; }
.rd-overview-sep { color: #d9d9d9; margin: 0 4px; }
.rd-overview-rate { font-weight: 700; font-size: 18px; }
.rd-overview-rules { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; font-size: 13px; color: #8c8c8c; }
.rd-overview-rules-label { color: #595959; font-weight: 500; }
.rd-overview-rule { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
.rd-section-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.rd-filtered-section { margin-top: 16px; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
.rd-filtered-toggle { padding: 10px 14px; font-size: 12px; font-weight: 500; color: #595959; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fafafa; transition: background 0.2s; }
.rd-filtered-toggle:hover { background: #f0f0f0; }
.rd-filtered-list { padding: 8px 14px; display: flex; flex-direction: column; gap: 6px; }
.rd-filtered-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.rd-filtered-item:last-child { border-bottom: none; }
.rd-filtered-title { flex: 1; color: #1a1a1a; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-filtered-reason { color: #8c8c8c; font-size: 11px; flex-shrink: 0; }

/* 告警降噪率单元格 */
.noise-reduction-cell { display: flex; align-items: center; gap: 6px; }
.noise-reduction-bar { width: 60px; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; flex-shrink: 0; }
.noise-reduction-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.noise-reduction-fill.high { background: #52c41a; }
.noise-reduction-fill.medium { background: #1890ff; }
.noise-reduction-fill.low { background: #d9d9d9; }
.noise-reduction-value { font-size: 12px; font-weight: 500; color: #1a1a1a; }
```

---

## 3. 前端修改 — AlarmDetailView.vue

### 3.1 Header 级别标签（L215-218）

**改前：**
```js
const levelText = computed(() => {
  const l = incident.value?.level
  return { critical: 'P1 紧急', warning: 'P2 重要', info: 'P3 提示' }[l] || l
})
```

**改后：**
```js
const levelText = computed(() => {
  const l = incident.value?.level
  return { critical: '紧急', warning: '重要', info: '次要' }[l] || l
})
```

### 3.2 关联告警表格级别标签（L99）

**改前：**
```html
{{ { critical: '紧急', warning: '重要', info: '提示' }[record.level] }}
```

**改后：**
```html
{{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] }}
```

---

## 4. 前端修改 — RealtimeView.vue

### 4.1 Intelligence Tab 级别标签（L355-356）

**改前：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">
  {{ { critical: '严重', warning: '警告', info: '提示' }[record.level] || record.level }}
</a-tag>
```

**改后：**
```html
<a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">
  {{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}
</a-tag>
```

### 4.2 告警状态统一（6 处）

| 行号 | 位置 | 改前 | 改后 |
|---|---|---|---|
| L175 | 当前告警表格 | `firing→'告警中'` | `firing→'待处理'` |
| L435 | 详情面板状态行 | `firing→'告警中'` | `firing→'待处理'` |
| L475 | 详情面板状态标签 | `firing→'告警中'` | `firing→'待处理'` |
| L1413 | AI分析文本 | `'处于告警中状态'` | `'处于待处理状态'` |
| L1453 | AI分析文本 | `'告警中'` | `'待处理'` |
| L1642 | Donut chart labels | `firing→'告警中'` | `firing→'待处理'` |

---

## 5. 前端修改 — CustomizeView.vue

### 5.1 列设置描述（L182）

**改前：**
```js
{ key: 'status', title: '告警状态', desc: '显示告警中/已恢复/已屏蔽', visible: true },
```

**改后：**
```js
{ key: 'status', title: '告警状态', desc: '显示待处理/已恢复/已屏蔽', visible: true },
```

---

## 6. 后端修改 — server.js

### 6.1 MOCK_INCIDENTS 扩展

在 `server/server.js` 中硬编码的 MOCK_INCIDENTS 数组（约 L1100-1373），新增 5 条故障：

```js
// 新增故障（覆盖所有7个分类）
{ id: 'INC-2026-0723', title: 'SSL证书即将过期告警', status: 'investigating', severity: 'P2',
  category: '证书类', relatedAlertIds: [13] },
{ id: 'INC-2026-0724', title: '核心交换机主链路中断', status: 'investigating', severity: 'P1',
  category: '网络类', relatedAlertIds: [14] },
{ id: 'INC-2026-0725', title: '物理机CPU温度过高', status: 'investigating', severity: 'P2',
  category: '硬件类', relatedAlertIds: [15] },
{ id: 'INC-2026-0726', title: '安全组规则对外开放', status: 'investigating', severity: 'P3',
  category: '配置类', relatedAlertIds: [16] },
// alert id=2 链接到 INC-2026-0718
```

### 6.2 CATEGORY_STRATEGY 映射

```js
const CATEGORY_STRATEGY = {
  '容量类': { heal: 'auto', label: 'AI自愈', color: 'green', desc: '自动扩容/缩容' },
  '阈值类': { heal: 'manual', label: '人工诊断', color: 'orange', desc: '需人工排查根因' },
  '证书类': { heal: 'auto', label: '自动续期', color: 'green', desc: '自动续签证书' },
  '硬件类': { heal: 'auto', label: '自动重启', color: 'green', desc: '自动重启服务' },
  '网络类': { heal: 'manual', label: '拓扑分析', color: 'orange', desc: '需人工分析网络拓扑' },
  '服务类': { heal: 'auto', label: '自动拉起', color: 'green', desc: '自动拉起服务' },
  '配置类': { heal: 'auto', label: '自动拦截', color: 'green', desc: '自动拦截违规配置' },
}
```

### 6.3 `/api/alarm/incidents` 端点

**关键逻辑：**
1. 从 alerts 表按 `incident_id` 分组
2. 每组查找 MOCK_INCIDENTS 获取 title/description
3. 只保留有 MOCK_INCIDENTS 对应的故障（过滤 UNLINKED）
4. 按 `catOrder` 固定分类顺序排序
5. 返回 `categoryStats`（各分类告警数统计）

**返回字段：**
```js
{
  incident_no: 'INC-2026-0720',
  title: MOCK_INCIDENTS.title,           // 故障名称
  root_cause: MOCK_INCIDENTS.description,
  level: 'critical',                      // 最高告警级别
  category: '容量类',
  category_label: 'AI自愈',
  heal_color: 'green',
  heal_desc: '自动扩容/缩容',
  status: 'investigating',
  affected_count: 4,
  noise_reduction: 60,                    // 降噪率
  raw_count: 10,                          // 原始告警数
  handler: 'ai',
  related_alerts: [alert1, alert2, ...],
  created_at: '2026-07-20T10:32:00',
}
```

### 6.4 分类统计排序

```js
const catOrder = ['阈值类', '硬件类', '容量类', '服务类', '证书类', '配置类', '网络类']
// categoryStats 按此顺序排列，而非按数量排序
```

---

## 7. 后端修改 — mockData.js

### 7.1 新增 4 条告警

在 `server/db/mockData.js` 的 alerts 表中新增：

```js
{ id: 13, title: '物理机CPU温度过高', resource: '物理机-03', level: 'warning', status: 'firing',
  trigger_time: '2026-07-20 10:00:00', incident_id: 'INC-2026-0723', category: '硬件类' },
{ id: 14, title: '交换机端口Down', resource: 'sw-core-01', level: 'critical', status: 'firing',
  trigger_time: '2026-07-20 09:50:00', incident_id: 'INC-2026-0724', category: '网络类' },
{ id: 15, title: '安全组规则对外开放', resource: 'sg-prod-01', level: 'info', status: 'firing',
  trigger_time: '2026-07-20 09:40:00', incident_id: 'INC-2026-0726', category: '配置类' },
{ id: 16, title: 'BGP邻居断开', resource: 'router-01', level: 'critical', status: 'firing',
  trigger_time: '2026-07-20 09:30:00', incident_id: 'INC-2026-0724', category: '网络类' },
```

**注意：** `incident_id` 必须与 MOCK_INCIDENTS.id 完全一致，否则关联断裂。

---

## 8. 后端修改 — routes/cmdb.js

### 8.1 AI 测试告警动态时间戳

```js
const AI_TEST_IDS = new Set([17, 18, 19, 20, 21, 22])
const AI_TEST_OFFSETS = { 17: 25, 18: 40, 19: 15, 20: 30, 21: 55, 22: 20 }

function freshTriggerTime(id) {
  if (!AI_TEST_IDS.has(id)) return null
  var mins = AI_TEST_OFFSETS[id] || 30
  var d = new Date(Date.now() - mins * 60000)
  var pad = function(v) { return v < 10 ? '0' + v : '' + v }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '+08'
}

// 覆盖通用路由，注入动态时间戳
router.get('/alerts', async (req, res) => {
  try {
    const rows = getTable('alerts').map(function(a) {
      var ts = freshTriggerTime(a.id)
      return ts ? Object.assign({}, a, { trigger_time: ts }) : a
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

## 9. 测试修改 — alarm-analysis.spec.js

### 9.1 测试用例清单（39个）

| # | 测试名称 | 验证内容 |
|---|---|---|
| 1-5 | 首页 Tab 切换 | Tab 按钮可见、高亮、URL 变化、内容渲染/消失、重定向 |
| 6-7 | 页面5行布局 Row1 | Hero 指标卡 4 个指标、数值正确 |
| 8-9 | 页面5行布局 Row2 | 3 个图表卡片各有 G2 图表、降噪率数值 |
| 10-12 | 页面5行布局 Row3 | 表格渲染、列名正确、操作列 |
| 13 | 页面5行布局 Row4 | 需关注应用卡片 |
| 14 | 页面5行布局 Row5 | 自动修复记录列表 |
| 15-23 | 表格交互 | 状态筛选、搜索、故障名链接、操作列、容量类自愈、查看详情、级别/状态标签、处理人 |
| 24-27 | 分类视图 | 7 个分类标签、切换视图、告警数量、点击筛选 |
| 28-31 | 详情页 | 加载正常、事件编号+标题、返回按钮存在、返回跳转 |
| 32 | 页面级异常检测 | 无 JS 错误 |
| 33-39 | 完整故事线 | 6 步流程：进入→搜索→跳转详情→验证详情→返回→Drawer→关闭 |

### 9.2 关键测试改动

**级别标签测试（L224）：**
```js
// 改前
test('级别标签正确渲染（P1紧急/P2重要/P3提示）', async ({ page }) => {
  const criticalTag = page.locator('.ant-table-tbody .ant-tag', { hasText: 'P1紧急' })
// 改后
test('级别标签正确渲染（紧急/重要/次要）', async ({ page }) => {
  const criticalTag = page.locator('.ant-table-tbody .ant-tag', { hasText: '紧急' })
```

**图表标题测试（L124-126）：**
```js
// 改前
await expect(chartCards.nth(0)).toContainText('TopN 告警分类分布')
await expect(chartCards.nth(1)).toContainText('降噪漏斗')
await expect(chartCards.nth(2)).toContainText('处理趋势')
// 改后
await expect(chartCards.nth(0)).toContainText('告警类别分布')
await expect(chartCards.nth(1)).toContainText('告警降噪过滤')
await expect(chartCards.nth(2)).toContainText('告警AI处理趋势')
```

**降噪率数值测试（L132）：**
```js
// 改前
await expect(page.locator('.aa-funnel-rate')).toContainText('58%')
// 改后
await expect(page.locator('.aa-hero-val').nth(1)).toContainText('76%')
```

---

## 10. 告警级别体系

### 10.1 系统定义

| 枚举值 | 中文 | 颜色 | Ant Design color |
|---|---|---|---|
| `critical` | 紧急 | 红色 #F5222D | `red` |
| `warning` | 重要 | 橙色 #FA8C16 | `orange` |
| `info` | 次要 | 蓝色 #1890FF | `blue` |

### 10.2 故障级别（不同于告警级别）

故障（Incident）使用 P1/P2/P3 分级，与告警级别是两套体系：

| 故障级别 | 含义 | 对应告警级别 |
|---|---|---|
| P1 | 严重故障 | critical（紧急） |
| P2 | 一般故障 | warning（重要） |
| P3 | 轻微故障 | info（次要） |

### 10.3 注意事项

- **主表格显示故障**：级别列用 P1/P2/P3
- **Drawer 内告警列表**：级别列用 紧急/重要/次要
- **不要混用**：不能在告警列表显示 P1，也不能在故障表格显示"紧急"

---

## 11. 告警状态体系

### 11.1 状态映射

| 枚举值 | 中文 | 颜色 | 用途 |
|---|---|---|---|
| `firing` | 待处理 | red | 告警正在发生 |
| `resolved` | 已恢复/已闭环 | green | 告警已解决 |
| `suppressed` | 已屏蔽 | default | 告警被静默 |

### 11.2 故障状态（不同于告警状态）

| 故障状态 | 中文 | 说明 |
|---|---|---|
| `investigating` | 进行中 | 故障正在处理 |
| `resolved` | 已闭环 | 故障已解决 |
| `healing` | 修复中 | AI 正在自动修复 |

---

## 12. Drawer 重构

### 12.1 改前：两个独立 Drawer

```
Drawer 1: 降噪处理详情（点击降噪率数字打开）
  ├── 概览：原始→聚合后→降噪率
  ├── 处理规则（3条）
  └── 被聚合的告警列表

Drawer 2: 关联告警（点击关联告警数字打开）
  ├── 故障编号
  ├── 关联告警表格
  └── 查看告警根因按钮
```

### 12.2 改后：统一 Drawer

```
Drawer: 告警详情（两种入口都打开同一个）
  ├── 故障编号 + 故障名称
  ├── 降噪概览（一行式）
  │   ├── 降噪 10 → 4 | 降噪率 60%
  │   └── 规则 [同metric聚合(5min)] [重复触发过滤]
  ├── 关联告警表格（级别/告警名称/资源/状态/触发时间/操作）
  ├── 已过滤告警折叠区（默认折叠）
  └── 查看告警根因按钮
```

### 12.3 数据同源

两个入口共享同一个数据源 `relatedDrawerRecord`，包含：
- `raw_count`：原始告警数
- `affected_count`：关联告警数
- `noise_reduction`：降噪率
- `related_alerts`：关联告警列表

---

## 13. 踩坑清单

### 13.1 后端改了没重启

**表现：** 页面显示旧数据（如原始告警标题而非 MOCK_INCIDENTS.title）  
**解决：** `lsof -i :3001 -t | xargs kill -9` → `nohup node server/server.js &`  
**原因：** Vite 有 HMR 自动热更新，Node.js 后端没有

### 13.2 incident_id 不匹配

**表现：** 关联告警断裂，表格数据变少  
**解决：** 确保 `alerts.incident_id` 和 `MOCK_INCIDENTS.id` 完全一致  
**注意：** 改任一侧都要同步检查另一侧

### 13.3 Drawer 关闭按钮在左侧

**表现：** Ant Design Drawer 的 X 按钮默认在标题左侧  
**解决：** 全局 CSS 覆盖（在 App.vue 中）：
```css
.ant-drawer-header { display: flex !important; justify-content: flex-end !important; }
.ant-drawer-header-title { display: flex !important; justify-content: flex-end !important; width: 100% !important; }
.ant-drawer-close { order: 99 !important; margin-left: auto !important; }
```
**注意：** 必须用 `!important`，Ant Design CSS 优先级较高

### 13.4 G2 v5 柱子粗细

**表现：** 用 `style('maxHeight')` 不精确，柱子高度偏差大  
**解决：** 用 `encode('size', 16)` 精确控制

### 13.5 info 级别颜色 fallthrough

**表现：** 三元表达式 `critical ? 'red' : 'orange'` 导致 info 也显示 orange  
**解决：** 改为完整三元 `critical ? 'red' : warning ? 'orange' : 'blue'`

### 13.6 测试断言与实际不符

**表现：** 测试查找 "P1紧急" 但实际显示 "紧急"  
**解决：** 同步更新测试中的断言文本

### 13.7 CSS scoped 对 Drawer 无效

**表现：** `<style scoped>` 的样式对 Drawer 内容无效  
**原因：** Drawer 渲染在 `document.body` 下，不在组件 DOM 树内  
**解决：** 用非 scoped 的 `<style>` 块定义 Drawer 样式

### 13.8 Playwright 点击隐藏行

**表现：** `page.locator('.ant-table-tbody tr').first()` 点击的是隐藏的 measure-row  
**解决：** 用 `.ant-table-row` 选择器替代 `tr`

---

## 14. 数据结构参考

### 14.1 alerts 表（mockData.js）

```js
{
  id: Number,              // 唯一 ID
  title: String,           // 告警名称（如"CPU使用率超过90%"）
  resource: String,        // 资源名称（如"app-server-01"）
  level: String,           // critical | warning | info
  status: String,          // firing | resolved | suppressed
  trigger_time: String,    // "2026-07-20 10:32:00"
  incident_id: String|null, // 关联故障 ID（如"INC-2026-0720"）
  category: String,        // 阈值类 | 容量类 | 服务类 | 证书类 | 网络类 | 硬件类 | 配置类
}
```

### 14.2 MOCK_INCIDENTS（server.js）

```js
{
  id: String,              // 故障 ID（如"INC-2026-0720"）
  title: String,           // 故障名称（如"购物车核心交易链路数据库连接耗尽"）
  description: String,     // 故障描述
  status: String,          // investigating | resolved | healing
  severity: String,        // P1 | P2 | P3
  category: String,        // 分类
  relatedAlertIds: Array,  // 关联告警 ID 列表
}
```

### 14.3 `/api/alarm/incidents` 返回格式

```js
{
  success: true,
  data: [
    {
      incident_no: String,
      title: String,
      root_cause: String,
      level: String,
      category: String,
      category_label: String,
      heal_color: String,
      heal_desc: String,
      status: String,
      affected_count: Number,
      noise_reduction: Number,
      raw_count: Number,
      handler: String,
      related_alerts: Array,
      created_at: String,
      can_heal: Boolean,
    }
  ],
  categoryStats: [
    { category: String, count: Number }
  ]
}
```

---

## 15. 还原检查清单

如果要搭建类似模块，按以下顺序：

1. **路由** — `src/router/index.js` 添加路由（重定向 + 详情页）
2. **导航高亮** — `src/App.vue` 的 nav-item `:class` 添加路径判断
3. **后端 API** — `server/server.js` 添加端点（在 `app.use('/api/cmdb')` 之前）
4. **Mock 数据** — `server/db/mockData.js` 添加数据表，或在 `server.js` 中硬编码
5. **主页面** — `src/views/alarm/AlarmAnalysisView.vue`（5行布局：Hero→图表→操作栏→筛选→表格）
6. **详情页** — `src/views/alarm/AlarmDetailView.vue`（header→证据→建议→处理记录）
7. **组件** — 首页卡片/记录组件（如需要嵌入首页）
8. **Vite proxy** — `vite.config.js` 添加 API 代理（如新路径）
9. **测试** — `tests/alarm-analysis.spec.js`（Playwright，用 `page.locator` 断言）
10. **重启后端** — `lsof -i :3001 -t | xargs kill -9 && nohup node server/server.js &`
11. **运行测试** — `npx playwright test tests/alarm-analysis.spec.js`
12. **记录变更** — 写入 `docs/alarm-analysis-session-log-YYYYMMDD.md`

---

## 附录：告警级别/状态 grep 排查清单

修改告警级别或状态时，用以下命令全量排查：

```bash
# 排查告警级别
grep -rn "P1紧急\|P2重要\|P3提示\|P1 紧急\|P2 重要\|P3 提示\|严重\|警告" src/views/alarm/ --include="*.vue"

# 排查告警状态
grep -rn "告警中" src/views/alarm/ --include="*.vue"

# 排查级别颜色映射
grep -rn "critical.*red\|warning.*orange\|info.*blue\|info.*default" src/views/alarm/ --include="*.vue"
```

**已知例外：**
- `ExtensionView.vue` L111 的 "告警中IP地址" 是语义短语，不是状态标签，不改
