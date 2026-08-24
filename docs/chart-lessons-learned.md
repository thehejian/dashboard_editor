# 图表开发经验与教训

> 基于本项目 G2 v5 / G6 v5 / SVG 图表的实际开发经验整理。  
> 最后更新：2026-08-23

---

## 一、G2 v5 核心问题

### 1. Transpose 坐标变换强制旋转轴标签文字

**问题**：`coordinate({ transform: [{ type: 'transpose' }] })` 会将整个坐标系旋转90°，导致分类轴（x 轴）的文字被强制竖排显示。

**尝试过的无效方案**（全部不生效）：
- `axis('x', { label: { autoRotate: false } })` — 嵌套写法无效
- `axis('x', { labelAutoRotate: false })` — 扁平写法无效
- `axis('x', { label: { autoRotate: false, autoHide: true } })` — 无效
- `interval().label()` 在条形图上加标签 — 文字仍竖排
- 减小字号 `labelFontSize: 9` — 文字变小但仍是竖排
- `style: { textAlign: 'right' }` — 无法覆盖坐标变换

**根因**：G2 v5 的 transpose 是坐标系层面的变换，不是简单的视觉翻转。所有元素（包括文字）都跟随坐标系旋转，`autoRotate` 控制的是"在坐标系旋转后再额外旋转"，无法覆盖底层行为。

**解决方案**：将数据归一化到0-100范围，使底部轴显示短数字（0%, 25%, 50%, 75%, 100%），短数字不会触发 G2 的自动旋转。同时 `label: { autoRotate: false }` 对短数字有效。

**经验**：
- G2 v5 的 transpose ≠ 简单的方向翻转，是整个坐标系旋转变换
- 轴标签旋转由 G2 内部启发式算法决定，`autoRotate: false` 只是提示，不是强制
- 短数字/短文字比长文字更容易保持横排

### 2. G2 v5 双轴图容易重叠

**问题**：两个 View 共享 x 轴时，在小容器中容易重叠。

**解决方案**：单 View + `encode('color', 'type')` 合并数据比双 View 更简洁，避免轴重叠。

### 3. G2 v5 Tooltip 自定义

**问题**：`chart.interaction('tooltip', ...)` 启用后，自定义 tooltip 用 G2 的 `render` 回调不够可控。

**解决方案**：用 Vue `@mousemove` 事件追赶数据点比 G2 的 `render` 回调更可控，可以自由渲染任意 Vue 组件作为 tooltip。

### 4. Canvas 渲染 vs SVG 渲染

| 特性 | Canvas (G2) | SVG |
|---|---|---|
| 文字控制 | 差 — 文字跟随坐标系变换，无法独立控制方向 | 好 — 直接 DOM 渲染，文字方向完全可控 |
| 交互 | 好 — 内置 tooltip、缩放等 | 需自行实现 |
| 性能 | 大数据量好 | DOM 多时性能下降 |
| 布局 | autoFit，需注意容器 flex 布局 | 固定 viewBox，响应式简单 |
| 测试 | 需要 `canvas.width` / `getImageData()` | 可直接 `querySelector` |

**选择建议**：
- 需要精确控制文字方向 → SVG
- 需要丰富交互 → Canvas (G2)
- 简单静态图表 → SVG（更可预测）

### 5. G2 v5 Chart 容器与布局

```js
// 容器必须显式设高度，否则 G2 默认 400px
const chart = new Chart({ container: el, autoFit: true })

// CSS: 容器需 flex 布局
.aa-chart-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.aa-chart-inner canvas {
  width: 100% !important;
  height: 150px !important;  /* 必须显式设高度 */
}
```

**注意**：`autoFit: true` 只控制宽度自适应，高度需通过 CSS 或 `chart.height(N)` 显式设置。

### 6. G2 v5 轴配置最佳实践

```js
// 移除所有轴标题（减少视觉噪音）
chart.axis('x', { title: false })
chart.axis('y', { title: false, tickCount: 3 })

// 轴标签防重叠（水平轴）
chart.axis('x', { label: { autoRotate: false, autoHide: true } })

// 漏斗图底部轴：短数字 + 限制刻度数
chart.axis('y', { title: false, tickCount: 3, label: { autoRotate: false } })
```

**原则**：
- 移除所有轴标题（`title: false`），只保留数据标签
- 使用 `tickCount` 控制刻度密度
- 水平轴用 `label: { autoRotate: false }`（对短文字有效）

---

## 二、G6 v5 注意事项

### 节点 ID 获取
- `e.target?.id` 获取节点 ID，**不是** `e.itemId`

### Combo 子节点数据
- `getChildrenData(comboId)` 返回空 → 用 `getNodeData().filter(d => d.combo === id)`

### 坐标转换
- 用 `getElementPosition()` 或 `style.x/y` 获取节点位置
- `getClientByCanvas([x,y])` 将画布坐标转屏幕坐标

### hover-activate 不响应 DOM
- 手动 `graph.on('node:pointerenter', ...)` + `setItemState`

### tooltip 交互穿透
- 内置 tooltip 插件 `getContent` 返回字符串时，加 `pointer-events:none` 避免交互穿透

### 节点高亮
- 用 `setElementState(id, stateName)` + 在 node 配置 `state: { stateName: { style } }`
- **不是**手动修改 style

### 下游节点遍历 (BFS)
```js
function getDownstream(nodeId, edges) {
  const queue = [nodeId]
  const visited = new Set()
  while (queue.length) {
    const id = queue.shift()
    edges.forEach(e => {
      if (e.source === id && !visited.has(e.target)) {
        visited.add(e.target)
        queue.push(e.target)
      }
    })
  }
  return [...visited] // 不包含自身
}
```

---

## 三、SVG 图表实现经验

### 横向条形图（TopN/漏斗）
- SVG `<rect>` + `<text>` 直接渲染，文字方向完全可控
- `viewBox="0 0 W H"` 控制整体尺寸
- Y 轴标签用 `text-anchor: end` 右对齐
- X 轴标签居中：`x = barX + barWidth/2`

### 横向条形图定位公式
```html
<!-- Y 轴标签（步骤名）-->
<text :x="leftGap - 6" :y="barY + barH/2" text-anchor="end" dominant-baseline="middle">
  {{ item.label }}
</text>

<!-- 条形 -->
<rect :x="leftGap" :y="barY" :width="barW" :height="barH" />

<!-- 数值标签 -->
<text :x="leftGap + barW + 4" :y="barY + barH/2" text-anchor="start">
  {{ item.value }}
</text>
```

### 漏斗图
- 用递减的 `<rect>` 模拟漏斗形状（不画三角形）
- 条形从上到下递减，左侧轴显示步骤名
- 数值标签显示在条形右侧

---

## 四、数据 Mock 与 API

### 前端 Mock
- mock 数据直接写在 views 中，无独立 mock 层
- 通过 `page.route()` 在 Playwright 中拦截 API 返回测试数据

### API 拦截模式（Playwright）
```js
await page.route('**/api/alarm/overview-stats**', r => r.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data: { heroStats: {...}, categoryStats: [...], ... } })
}))
```

---

## 五、Playwright 图表测试

### G2 Canvas 测试
- G2 渲染到 Canvas 非 SVG → 用 `canvas.width` / `getImageData()` 验证
- 不能用 `querySelector('svg')` 检测 G2 图表
- 像素分析：通过扫描 canvas 像素判断文字渲染方向（horizontal vs vertical pixels）

### 文字方向检测方法
```js
// 水平像素扫描（检测横排文字）
for (let y = region.y; y < region.y + region.h; y += step) {
  let run = 0
  for (let x = region.x; x < region.x + region.w; x++) {
    const p = ctx.getImageData(x, y, 1, 1).data
    if (p[3] > 50) run++
    else if (run > threshold) { hPixels += run; run = 0 }
  }
}

// 垂直像素扫描（检测竖排文字）
for (let x = region.x; x < region.x + region.w; x += step) {
  let run = 0
  for (let y = region.y; y < region.y + region.h; y++) {
    // ...
  }
}
```

### 测试最佳实践
- `page.route()` 拦截 API → 返回固定数据 → 确定性断言
- `page.waitForSelector('.chart canvas', { timeout: 15000 })` 等待渲染完成
- `page.waitForTimeout(3000)` 额外等待动画完成
- 图表断言用 `boundingBox()` 检查尺寸，用像素扫描检查内容

---

## 六、常用调试命令

```bash
# 检查服务状态
lsof -i :5173 -i :3001

# 重启 Vite dev server
kill $(lsof -ti :5173) 2>/dev/null; sleep 1 && nohup npm run dev > /tmp/vite.log 2>&1 &

# 运行特定测试
npx playwright test tests/alarm-analysis.spec.js --reporter=line

# 快速验证图表渲染
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://admin:745544752@localhost:5173/overview?tab=alarm');
  await p.waitForSelector('.aa-chart-card canvas', { timeout: 15000 });
  await p.waitForTimeout(3000);
  const box = await p.locator('.aa-chart-card canvas').first().boundingBox();
  console.log('Chart size:', JSON.stringify(box));
  await p.screenshot({ path: '/tmp/chart.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
  await b.close();
})();
"
```

---

## 七、教训总结

1. **不要和 G2 v5 的坐标变换对抗**：transpose 强制旋转是底层行为，`autoRotate: false` 无法覆盖。要么适应（短数字），要么换方案（SVG）。

2. **数据归一化是解决轴标签问题的通用方案**：原始数值范围大 → 轴标签长 → 触发旋转。归一化到0-100或0-1000使标签变短。

3. **SVG 在需要精确文字控制时优于 Canvas**：Canvas 的文字渲染受坐标系变换影响，SVG 的文字是独立 DOM 元素，方向完全可控。

4. **测试图表时用像素扫描而非 DOM 查询**：G2 渲染到 Canvas，无法用 `querySelector` 检测内容。用 `getImageData()` 扫描像素是唯一可靠方法。

5. **Mock 数据要覆盖边界情况**：raw=0 时除法会出错，需要 `|| 1` 防护。有效事件 rate 可能为0。

6. **Chart 容器必须显式设高度**：`autoFit: true` 只管宽度，高度默认400px。在 flex 布局中必须用 CSS 显式设置。

7. **测试中用 `page.route()` 拦截 API**：返回固定数据比依赖后端真实数据更稳定。Mock 数据格式要和真实 API 一致。

8. **G2 轴标题 `title: false` 是最简单的减噪方式**：移除所有轴标题让图表更清爽。

9. **bug 常藏在数据映射中**：`有效事件`误用 `f.agg` 而非 `f.rate`，这种复制粘贴错误很难发现。每个字段都要对照数据来源验证。
