# 全站 Playwright 巡检 + 样式规范统一 变更记录

> 日期：2026-08-26
> 范围：全站 96 页巡检体系搭建、2 个真 Bug 修复、列表页模板规范统一

---

## 变更1：新增全站页面巡检测试 `tests/site-audit.spec.js`（新文件）

### 涉及页面
- 全站 96 个路由页 + 8 个 `/dashboard/:slug` 大屏

### 涉及文件
- `tests/site-audit.spec.js`（新增，约 300 行）

### 具体内容
4 个数据驱动测试：
- **A. 页面渲染巡检**：96 页 × 8 项检查（#app 存在 / 非空白 / `.header` 高度 48px / `#app padding-top:48px` / `--brand:#007DFF` 生效 / 内容元素存在 / 列表页模板结构 / JS 错误分类）
- **B. 顶部导航跳转**：6 大模块 16 次点击（含 antd 下拉菜单）
- **C. 路由重定向链**：16 条（`/` → `/aiops`、`/alarm/history` → `/alarm/current` 等）
- **D. Dashboard 大屏专项**：host/vm/nas/container/dev/test/bigdata/aimodel 8 个 slug 的工具栏/tab 高亮/图表渲染物检查

控制台错误白名单：`replaceState`（Vite basic auth 已知无害）、`Failed to load resource`、`net::ERR_*`、favicon。

报告输出：`test-results/site-audit-report.json`。

---

## 变更2：【P0】ApplyCreatePage 崩溃修复

### 涉及页面
- `/ops/account/apply/create`（申请创建，页面完全无法挂载）

### 涉及文件
- `src/views/ops/account/ApplyCreatePage.vue`

### 具体修改内容

**改前（L170）：**
```js
import { ref, reactive } from 'vue'
```
L202 使用了 `onMounted(async () => {...})` 但未导入 → script setup 抛 `ReferenceError: onMounted is not defined` ×26，整个组件挂载失败。

**改后（L170）：**
```js
import { ref, reactive, onMounted } from 'vue'
```

---

## 变更3：【P0】OperationLogConfig JSON.parse 崩溃修复

### 涉及页面
- `/ops/logs/operation/config`（转发配置表格永远为空）

### 涉及文件
- `src/views/ops/logs/OperationLogConfig.vue`

### 具体修改内容

后端 `forward_content` 存的是原始逗号串（如 `"app-*,nginx-*"`），不是 JSON：

**改前（L100）：**
```js
logType: item.forward_content ? JSON.parse(item.forward_content).join(',') : '--',
```

**改后：** 新增兼容两种格式的辅助函数，映射处调用它：
```js
function parseForwardContent(raw) {
  if (!raw) return '--'
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.join(',') : String(arr)
  } catch {
    return String(raw).split(',').join(',')
  }
}
// ...
logType: parseForwardContent(item.forward_content),
```

---

## 变更4：【P1】9 个在用页面 h2→h3 标题统一

### 涉及页面与文件
| 路由 | 文件 |
|---|---|
| /alarm/events | `src/views/alarm/EventsView.vue` |
| /alarm/settings/rules | `src/views/alarm/ConfigView.vue` |
| /alarm/customize | `src/views/alarm/CustomizeView.vue` |
| /monitor/config | `src/views/monitor/MonitorConfigView.vue` |
| /resource/topology | `src/views/resource/AssetTopologyView.vue` |
| /resource/changes | `src/views/resource/ChangesView.vue` |
| /ops/jobs | `src/views/ops/JobsView.vue` |
| /ops/inspect | `src/views/ops/InspectView.vue` |
| /system/config | `src/views/system/SystemConfigView.vue` |

### 具体修改内容
`.page-header > <h2>xxx</h2>` → `<h3>xxx</h3>`（每文件一处，sed 批量 + grep 校验）。

**跳过的废弃文件**（不在路由、无组件引用）：`UsersView.vue`、`HistoryView.vue`、`AssetListView.vue`。
**保留的 h2**：`TopologyView.vue:25`（节点详情抽屉标题）、`MonitorView.vue:5`（大屏画布标题）——不属于 `.page-header` 规范范围。

---

## 变更5：【P2】antd Modal 弃用 API 替换

### 涉及页面
- `/ops/logs/config/tasks/create`

### 涉及文件
- `src/views/ops/logs/LogCollectTaskCreate.vue`（全项目唯一使用处，共 5 处）

### 具体修改内容
`v-model:visible="xxx"` → `v-model:open="xxx"`，消除 `[ant-design-vue: Modal] 'visible' will be removed` 警告。

---

## 变更6：HealingRecordsView 补标准筛选行

### 涉及页面
- `/ops/incidents/config/records`（自愈执行记录——96 页中最后一个不合规列表页）

### 涉及文件
- `src/views/sre/HealingRecordsView.vue`

### 具体修改内容
按标准模板补 `.filter-bar`（状态筛选下拉 + 搜索框 flex:1）+ `filteredRecords` computed 过滤逻辑 + 对应 scoped 样式：
```css
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
```

---

## 可能出现的问题及解决方法

1. **巡检初版误报多（29 页）→ 三轮规则调优**
   - 「缺 h3」实为 h2：先修页面而非放宽规则
   - 「无内容元素」误报：`/monitor/resource/card` 等用 `.alert-cards/.monitor-body/.job-list` 自定义 class → 内容检测补充这些选择器及 `.ant-form/.ant-tabs/.ant-transfer`
   - 「缺 filter-bar」误报：`/ops/logs/*` 用 `.filter-admin`、`/ops/incidents/*` 用 `.il-filter-bar`、AuditView 用内联下拉 → 规则改为按功能意图判定（任一已知筛选行类名或筛选控件即通过；仅对含表格的页面生效）

2. **G6 minimap 容器类名**：源码传 `className:'minimap'` 但实际 DOM 类是 `.g6-minimap`，测试选择器以实测为准。

3. **minimap 底边对齐根因**：此前以为要改 G6 定位，实测发现是 `.network-canvas` 的 `min-height:500px` 在时间轴模式（行高 452px）下溢出 48px，把画布拉到阶段面板下方。改 `min-height:320px` 后自然对齐（本条为此前会话改动，HEAD 已包含）。

## 变更7：Playwright 门禁加固（脚本审计 + 修复）

### 涉及页面
- `/alarm/current`、`/resource/list/manage`、`/ops/events/list/*`（搜索框位置规范化）
- `/ops/events/list/*`（删除 2 处绑定死 ref 的无效搜索框）

### 涉及文件
- `tests/site-audit.spec.js`（门禁加固）
- `src/views/alarm/RealtimeView.vue`、`src/views/resource/portal/ManageView.vue`、`src/views/ops/events/EventList.vue`

### 脚本审计发现并修复的问题
1. **报告互相覆盖 bug**：5 种巡检写同一 `site-audit-report.json`，最终只剩最后一个 → 改为按 kind 分文件
2. **下拉跳转未校验 URL**：Test B 11 个菜单项 `ok:true` 硬编码 → 补 URL 前缀断言 + `.nav-item.active` 高亮校验
3. **后端宕机无提示**：加 `ensureBackend()` 快速失败，明确提示 `bash start.sh`
4. **左侧树菜单零覆盖**：新增 Test E 抽查告警/日志两组 6 次点击
5. **样式规范未落地**：补筛选控件 32px、搜索框末位贴右检查

### 新增检查抓出的真实违规（已修）
- 三页搜索框不在筛选行末位 → 统一为「筛选 → 查询/重置 → 搜索框(flex:1)」
- EventList 两处 `searchKeyword` 死控件（从未参与过滤）→ 删除；其中一处是误粘贴进展开行详情的复制事故

### 调参过程中避免的误报
- 控件高度须量 `.ant-input-affix-wrapper` 外层而非内层裸 input（22px 假象）
- 「贴右」按内容盒算（剔除 filter-bar 自身 padding:12px），否则 13px 假阳性
- antd Tree 幽灵节点必须 `:visible` 过滤（见 AGENTS.md）

### 验证
- site-audit：**5/5 通过**（96 页 0 问题 / 15 导航 / 16 重定向 / 8 大屏 / 6 左树跳转）
- 全量回归：**201/201 通过**

## 验证结果汇总（当日最终）
- 第一轮修复后：site-audit 4/4、全量回归 178/178
- 门禁加固 + 规范违规修复后：site-audit **5/5**（96 页 0 问题）、全量回归 **201/201**
- 巡检报告：`test-results/site-audit-report-{render,nav-jumps,redirects,dashboards,left-tree-jumps}.json`
