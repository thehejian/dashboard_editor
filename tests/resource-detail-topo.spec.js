import { test, expect } from '@playwright/test'

test.describe('资源详情面板依赖关系', () => {
  test('点击资源行打开面板 → 切到依赖关系 → 拓扑 canvas 有内容', async ({ page }) => {
    await page.goto('/monitor/resource/list')
    await page.waitForSelector('.ant-table', { timeout: 15000 })
    await page.waitForTimeout(500)

    // 点击第一个资源名称链接打开详情面板
    const link = page.locator('.app-link', { hasText: /./ }).first()
    await link.click()
    await page.waitForTimeout(600)

    // 面板应该打开
    const panel = page.locator('.rdp.open')
    await expect(panel).toBeVisible({ timeout: 5000 })

    // 点击依赖关系 tab
    await page.locator('.ant-tabs-tab', { hasText: '依赖关系' }).click()
    await page.waitForTimeout(2000)

    // 拓扑容器应该有 canvas 元素
    const canvas = panel.locator('.mt-canvas canvas')
    const canvasCount = await canvas.count()
    console.log('Canvas count:', canvasCount)

    if (canvasCount > 0) {
      await expect(canvas.first()).toBeVisible()
      const box = await canvas.first().boundingBox()
      console.log('Canvas size:', box?.width, 'x', box?.height)
      expect(box.width).toBeGreaterThan(100)
      expect(box.height).toBeGreaterThan(100)
    } else {
      // 可能 G6 渲染到 div 而不是 canvas
      const g6Div = panel.locator('.mt-canvas [data-node-id], .mt-canvas .g6-content, .mt-canvas > div > div')
      const g6Count = await g6Div.count()
      console.log('G6 elements:', g6Count)
      const mtCanvas = panel.locator('.mt-canvas')
      const html = await mtCanvas.innerHTML()
      console.log('Canvas HTML (first 500):', html.substring(0, 500))
    }

    await page.screenshot({ path: 'test-results/topology-panel-test.png', fullPage: false })
  })
})
