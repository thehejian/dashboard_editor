import { test, expect } from '@playwright/test'

test.describe('Topology 时间轴模式左右分栏', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/monitor/topology?tab=application&appTab=order')
    // 等待时间轴加载（incidentStages 返回后才会渲染）
    await page.waitForSelector('.incident-timeline', { timeout: 15000 })
    // 等待分栏布局激活
    await page.waitForSelector('.topo-split.split-active', { timeout: 15000 })
  })

  test('左 3/4 右 1/4 分栏比例', async ({ page }) => {
    const split = await page.locator('.topo-split').boundingBox()
    const left = await page.locator('.topo-split-left').boundingBox()
    const right = await page.locator('.topo-split-right').boundingBox()
    expect(split).toBeTruthy()
    expect(left).toBeTruthy()
    expect(right).toBeTruthy()
    // 左 3/4，右 1/4，比例约 3:1（gap 12px 误差内）
    const ratio = left.width / right.width
    expect(ratio).toBeGreaterThan(2.2)
    expect(ratio).toBeLessThan(3.8)
    // 右侧常驻可见
    await expect(page.locator('.topo-split-right')).toBeVisible()
  })

  test('点击时间轴阶段后右侧详情更新', async ({ page }) => {
    const firstLabel = (await page.locator('.topo-split-right h3').innerText()).trim()
    // 点击最后一个阶段
    const stages = page.locator('.tl-stage')
    const count = await stages.count()
    await stages.nth(count - 1).click()
    await page.waitForTimeout(500)
    const newLabel = (await page.locator('.topo-split-right h3').innerText()).trim()
    expect(newLabel.length).toBeGreaterThan(0)
    // 详情区包含影响节点
    await expect(page.locator('.topo-split-right')).toContainText('影响节点')
    expect(firstLabel).not.toEqual(newLabel)
  })

  test('关闭右侧面板后拓扑恢复全宽', async ({ page }) => {
    const split = await page.locator('.topo-split').boundingBox()
    const leftBefore = await page.locator('.topo-split-left').boundingBox()
    // 关闭
    await page.locator('.topo-split-right .close-btn').click()
    await page.waitForTimeout(500)
    await expect(page.locator('.topo-split-right')).toBeHidden()
    const leftAfter = await page.locator('.topo-split-left').boundingBox()
    // 关闭后左栏应几乎占满 split 宽度
    expect(leftAfter.width).toBeGreaterThan(split.width * 0.95)
    expect(leftAfter.width).toBeGreaterThan(leftBefore.width)
  })

  test('关闭后点击阶段重新打开面板', async ({ page }) => {
    // 关闭面板
    await page.locator('.topo-split-right .close-btn').click()
    await page.waitForTimeout(800)
    await expect(page.locator('.topo-split-right')).toBeHidden()
    // 确保 .panel-hidden class 存在
    await expect(page.locator('.topo-split-right.panel-hidden')).toHaveCount(1)
    // 点击时间轴阶段
    const stages = page.locator('.tl-stage')
    const count = await stages.count()
    expect(count).toBeGreaterThan(0)
    await stages.nth(0).click()
    await page.waitForTimeout(800)
    // 面板应重新可见
    await expect(page.locator('.topo-split-right')).toBeVisible()
    await expect(page.locator('.topo-split-right.panel-hidden')).toHaveCount(0)
    // 详情内容应出现
    await expect(page.locator('.topo-split-right h3')).toHaveText(/.+/)
    await expect(page.locator('.topo-split-right')).toContainText('影响节点')
  })

  test('缩略图(minimap)存在', async ({ page }) => {
    // G6 minimap 渲染为 canvas
    const canvases = await page.locator('.topo-split-left canvas').count()
    expect(canvases).toBeGreaterThanOrEqual(1)
  })

  test('缩略图缩小为约 140x110 且底边距阶段面板 8px', async ({ page }) => {
    const mm = page.locator('.topo-split-left .network-canvas .g6-minimap')
    await expect(mm).toHaveCount(1)
    const box = await mm.boundingBox()
    expect(box.width).toBeGreaterThan(130)
    expect(box.width).toBeLessThan(155)
    expect(box.height).toBeGreaterThan(100)
    expect(box.height).toBeLessThan(125)
    // 底边与右侧阶段面板(.topo-split-right)底边的间隙约 8px
    const stageBox = await page.locator('.topo-split-right').boundingBox()
    const gap = stageBox.y + stageBox.height - (box.y + box.height)
    expect(Math.abs(gap - 0)).toBeLessThan(3)
  })

  test('非时间轴模式(云系统)保持全宽布局', async ({ page }) => {
    await page.goto('/monitor/topology')
    await page.waitForSelector('.topo-split', { timeout: 15000 })
    // 非时间轴模式不应有 split-active
    await expect(page.locator('.topo-split.split-active')).toHaveCount(0)
    // 区域卡片（云系统资源视图）正常显示
    await expect(page.locator('.region-cards')).toBeVisible()
    // 拓扑占满整行
    const split = await page.locator('.topo-split').boundingBox()
    const left = await page.locator('.topo-split-left').boundingBox()
    expect(left.width).toBeGreaterThan(split.width * 0.95)
  })
})
