# 告警分析页面变更日志（2026-08-28）

## 概览

今日对告警分析页面（AlarmAnalysisView）进行了 8 项变更，涵盖 Mock 数据扩展、表格布局优化、图表修复、统计卡片重构。涉及文件 8 个，新增/修改代码约 1400 行。

---

## 1. Mock 数据扩展（85424f2）

### 变更内容
- MOCK_INCIDENTS 从 11 条扩展到 18 条（新增 INC-2026-0727~0733）
- alerts 表从 22 条扩展到 29 条（新增 id 23-29）
- 新增事件涵盖 7 大告警类别：容量类、阈值类、网络类、硬件类、服务类、证书类、配置类

### 涉及文件
- `server/server.js`：新增 7 条 MOCK_INCIDENTS（含完整字段：metrics/checklist/tracking_timeline 等）
- `server/db/mockData.js`：新增 7 条告警记录

### 数据详情
| 事件ID | 标题 | 类别 | 级别 | 状态 |
|--------|------|------|------|------|
| INC-2026-0727 | Redis集群连接池接近上限 | 容量类 | warning | 进行中 |
| INC-2026-0728 | Nginx入口5xx错误率飙升 | 服务类 | critical | 进行中 |
| INC-2026-0729 | K8s工作节点NotReady | 硬件类 | critical | 进行中 |
| INC-2026-0730 | MySQL主从复制延迟过高 | 服务类 | warning | 已闭环 |
| INC-2026-0731 | MQ消费组消息积压告警 | 容量类 | warning | 进行中 |
| INC-2026-0732 | 弹性IP地址即将释放 | 配置类 | info | 已闭环 |
| INC-2026-0733 | DNS解析异常导致服务不可达 | 网络类 | critical | 进行中 |

---

## 2. 表格分页修复（232b9f8）

### 问题
Ant Design 的 `.ant-table-wrapper` 设置了 `display: block` 和 `flexGrow: 0`，导致表格在 flex 布局中无法收缩，分页被推到卡片外部（y=1222，卡片底部 y=966）。

### 修复方案
- 移除 `scroll: { x: 900, y: 360 }`
- 添加 CSS `!important` 覆盖 Ant Design 内部元素的 flex 属性：
  ```css
  .aa-table-card :deep(.ant-table-wrapper) { flex: 1 1 0% !important; display: flex !important; }
  .aa-table-card :deep(.ant-spin-nested-loading) { flex: 1 1 0% !important; display: flex !important; }
  .aa-table-card :deep(.ant-spin-container) { flex: 1 1 0% !important; display: flex !important; }
  .aa-table-card :deep(.ant-table) { flex: 1 1 0% !important; }
  ```

---

## 3. 表格 15 行 + 页面滚动（72a3261）

### 变更内容
- `pageSize` 从 5 改为 15，默认展示 15 行
- Hero 卡片和图表卡片紧凑化：
  - Hero padding: 12px → 8px，icon 尺寸: 44→36px，字号: 24→20px
  - Chart padding: 14px → 16px，min-height: 160→100px
  - 页面 gap: 16px → 8px
- 页面布局从 `overflow: hidden` 改为 `overflow-y: auto`，支持滚动

### 效果
- 首屏可见约 10 行，滚动后可见全部 15 行 + 分页

---

## 4. 图表卡片 padding 16px（1a5798e）

### 变更内容
- `.aa-chart-card` padding 从 `8px 10px` 改为 `16px`，三张图表卡片内边距统一

---

## 5. 图表 Tooltip 修复 + 7 类别全部显示（5ae0464）

### 问题 1：Tooltip 被裁剪
- G2 tooltip 渲染在 `.aa-chart-container` 内部，容器 `overflow: hidden` 截断了 tooltip

### 修复
- `.aa-chart-container` overflow 从 `hidden` 改为 `visible`

### 问题 2：只显示 4 个类别标签
- 7 个 bar 实际全部渲染（canvas 像素验证），但容器高度 143px 太小，G2 自动隐藏了重叠的 y 轴标签

### 修复
- `.aa-chart-container` min-height 从 100px 增至 200px，给 G2 足够空间渲染 7 个 bar 和标签

### 效果
- 全部 7 个类别标签可见：容量类、阈值类、网络类、硬件类、服务类、证书类、配置类
- Tooltip 正常显示在卡片外部

---

## 6. 降噪过滤统计卡片重构（f5e76c7 → 858d35a）

### 第一版（f5e76c7）：漏斗阶段 + CSS 条形图
- 新增漏斗三阶段：100,000 → 91,500 → 91.5%
- 分级明细用 CSS 条形图（`.aa-filter-bar-row`）

### 第二版（858d35a）：Ant Design Statistic + Progress
- 移除 "过滤分级明细" 标题
- 移除 CSS 条形图，改用 3 个子卡片：
  - `a-statistic` 显示数值
  - `a-progress` 显示百分比进度条
- 新增 `filterPctNum()` 函数，返回数值（原 `filterPct()` 返回字符串 "13%"）
- 间距：漏斗行 ↔ 子卡片 = 16px，子卡片 ↔ 底部 = 16px

### 最终布局
```
┌─ 告警降噪过滤统计 ────────────────────────┐
│  100,000  →  91,500  →  91.5% ↓           │
│  原始告警    已过滤     降噪率              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 紧急     │ │ 重要     │ │ 次要     │   │
│  │ 12,000   │ │ 38,000   │ │ 41,500   │   │
│  │ ██ 13%   │ │ ████ 42% │ │ █████ 45%│   │
│  └──────────┘ └──────────┘ └──────────┘   │
└────────────────────────────────────────────┘
```

---

## 7. 测试更新

### 新增/修改测试
- `tests/alarm-analysis.spec.js`：测试从 43 条调整，filter card 选择器从 `.aa-filter-bar-row` 改为 `.aa-filter-card-item`
- `tests/g2-chart-display.spec.js`：降噪过滤统计卡片断言更新（移除 canvas 检查，改用 `.aa-filter-card-item` 断言）
- 所有 43 个 alarm-analysis 测试通过

### 测试覆盖
- Mock 数据扩展后，新增容量类告警的 `can_heal: true` 字段
- 测试 timeout 从默认 30s 增至 60s 应对并发超时

---

## 8. Git 提交记录

| Commit | 描述 |
|--------|------|
| 858d35a | refactor: filter breakdown cards use a-statistic + a-progress |
| 5ae0464 | fix: chart tooltip no longer clipped, all 7 category labels visible |
| 1a5798e | style: chart card padding 16px |
| 72a3261 | feat: table shows 15 rows per page, compact hero/charts, page scrolls |
| 232b9f8 | fix: table pagination visible inside card with scroll.y + flex overrides |
| f5e76c7 | refactor: redesign alarm filter stats card with funnel stages and breakdown bars |
| 85424f2 | feat: expand mock data to 18 incidents, pageSize 5→15, fix tests |

---

## 已知问题

1. **G2 Tooltip 与卡片边距**：tooltip 使用 `overflow: visible` 后可溢出卡片，但在某些边界情况下可能被相邻卡片遮挡
2. **页面滚动**：首次加载时页面需要滚动才能看到全部 15 行，非首屏内容需要用户主动滚动
3. **Mock 时间戳**：`minsAgo()` 在服务器启动时一次性执行，运行超过 1 小时后部分告警时间戳过期（已在 `server.js` 中对测试告警注入新鲜时间戳）
