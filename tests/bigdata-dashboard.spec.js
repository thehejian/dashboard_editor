import { test, expect } from '@playwright/test'

test.describe('大数据监控 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/bigdata')
    await page.waitForSelector('.bd-dashboard', { timeout: 10000 })
  })

  test('页面加载正常，核心容器存在', async ({ page }) => {
    await expect(page.locator('.bd-dashboard')).toBeAttached()
    await expect(page.locator('.bd-toolbar')).toBeAttached()
    await expect(page.locator('.bd-summary')).toBeAttached()
  })

  test('摘要卡片渲染 4 个', async ({ page }) => {
    const cards = page.locator('.bd-summary-card')
    await expect(cards).toHaveCount(4)
    await expect(cards.nth(0).locator('.bd-summary-label')).toHaveText('集群节点')
    await expect(cards.nth(1).locator('.bd-summary-label')).toHaveText('活跃告警')
    await expect(cards.nth(2).locator('.bd-summary-label')).toHaveText('运行任务')
    await expect(cards.nth(3).locator('.bd-summary-label')).toHaveText('集群健康率')
  })

  test('时间范围 pills 可点击切换', async ({ page }) => {
    const pill7d = page.locator('.bd-time-pill', { hasText: '7d' })
    await pill7d.click()
    await expect(pill7d).toHaveClass(/active/)
    await expect(page.locator('.bd-time-pill.active')).toHaveCount(1)
  })

  test('云服务 API 表格 + 统计行 + 缩略图', async ({ page }) => {
    const section = page.locator('.bd-section').first()
    await expect(section.locator('.bd-section-title')).toContainText('云服务 API 监测')
    await expect(section.locator('.bd-stats-row .bd-stat-pill')).toHaveCount(7)
    await expect(section.locator('.ant-table-thead th')).toHaveCount(4)
    await expect(section.locator('.ant-table-tbody tr')).toHaveCount(7)
    await expect(section.locator('.bd-cell-spark')).toHaveCount(21)
  })

  test('API 单元格缩略图着色正确', async ({ page }) => {
    const sparks = page.locator('.bd-cell-spark')
    await expect(sparks.first()).toBeAttached()
    const fillPolygons = await sparks.evaluateAll(el => el.map(s => s.querySelector('polyline')?.getAttribute('stroke') || ''))
    const hasBlueOrGreen = fillPolygons.some(c => c === '#1890ff' || c === '#52c41a')
    expect(hasBlueOrGreen).toBe(true)
  })

  test('集群资源总览子系统卡片渲染', async ({ page }) => {
    const subsysCards = page.locator('.bd-subsys-card')
    const count = await subsysCards.count()
    expect(count).toBe(16)
  })

  test('子系统筛选 pills 可用', async ({ page }) => {
    const pills = page.locator('.bd-subsys-pills button')
    const count = await pills.count()
    expect(count).toBeGreaterThanOrEqual(10)

    await pills.nth(2).click()
    await expect(pills.nth(2)).toHaveClass(/active/)
  })

  test('子系统卡片可折叠', async ({ page }) => {
    const firstHeader = page.locator('.bd-subsys-header').first()
    const firstBody = page.locator('.bd-subsys-body').first()
    await expect(firstBody).toBeVisible()
    await firstHeader.click()
    await expect(firstBody).not.toBeVisible()
    await firstHeader.click()
    await expect(firstBody).toBeVisible()
  })

  test('百分比指标着色正确', async ({ page }) => {
    const hostCard = page.locator('#subsys-host')
    const values = hostCard.locator('.bd-metric-value')
    const count = await values.count()
    expect(count).toBe(5)
    const classes = await values.evaluateAll(el => el.map(e => e.className))
    const hasColorClass = classes.some(c => c.includes('bd-normal') || c.includes('bd-warn') || c.includes('bd-danger'))
    expect(hasColorClass).toBe(true)
  })

  test('截图对比 — 整页', async ({ page }) => {
    await page.waitForTimeout(500)
    await expect(page.locator('.bd-dashboard')).toHaveScreenshot('bigdata-dashboard.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: true,
    })
  })
})
