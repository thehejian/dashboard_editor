import { test, expect } from '@playwright/test'

const MOCK_OVERVIEW_STATS = {
  success: true,
  data: {
    heroStats: { closedCount: 128, reductionRate: 76, autoRate: 42 },
    categoryStats: [
      { category: '容量类', pct: 32 }, { category: '阈值类', pct: 28 },
      { category: '网络类', pct: 18 }, { category: '证书类', pct: 12 },
      { category: '服务类', pct: 8 }, { category: '硬件类', pct: 2 },
    ],
    funnelData: { raw: 1200, dedup: 1020, agg: 504, rate: 58, filteredCritical: 12, filteredWarning: 45, filteredInfo: 180 },
  },
}

const MOCK_INCIDENTS = {
  success: true,
  data: [
    { incident_no: 'INC-001', title: 'CPU负载过高', level: 'critical', category: '容量类', status: 'investigating', handler: 'ai', affected_count: 3, related_alerts: [{ resource: 's1', level: 'critical', category: '计算' }] },
    { incident_no: 'INC-002', title: 'DB连接池耗尽', level: 'warning', category: '服务类', status: 'resolved', handler: 'manual', affected_count: 5, related_alerts: [] },
  ],
}

test.describe('G2 图表渲染检测', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.aa-chart-container', { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('2个图表容器各有1个canvas元素', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    await expect(chartCards).toHaveCount(3)
    await expect(chartCards.nth(0).locator('canvas')).toHaveCount(1)
    await expect(chartCards.nth(1).locator('canvas')).toHaveCount(0)
    await expect(chartCards.nth(2).locator('canvas')).toHaveCount(1)
  })

  test('TopN图表canvas有实际像素内容', async ({ page }) => {
    const canvas = page.locator('.aa-chart-card').nth(0).locator('canvas')
    const hasContent = await canvas.evaluate(el => {
      const ctx = el.getContext('2d')
      if (!ctx) return false
      const w = el.width, h = el.height
      if (w === 0 || h === 0) return false
      const imageData = ctx.getImageData(0, 0, w, h)
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) return true
      }
      return false
    })
    expect(hasContent).toBe(true)
  })

  test('降噪过滤统计卡片无canvas，显示漏斗三阶段和分级条形图', async ({ page }) => {
    const card = page.locator('.aa-chart-card').nth(1)
    await expect(card.locator('canvas')).toHaveCount(0)
    await expect(card).toContainText('原始告警')
    await expect(card).toContainText('已过滤')
    await expect(card).toContainText('降噪率')
    await expect(card).toContainText('过滤分级明细')
    await expect(card).toContainText('紧急')
    await expect(card).toContainText('重要')
    await expect(card).toContainText('次要')
  })

  test('趋势图表canvas有实际像素内容', async ({ page }) => {
    const canvas = page.locator('.aa-chart-card').nth(2).locator('canvas')
    const hasContent = await canvas.evaluate(el => {
      const ctx = el.getContext('2d')
      if (!ctx) return false
      const w = el.width, h = el.height
      if (w === 0 || h === 0) return false
      const imageData = ctx.getImageData(0, 0, w, h)
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) return true
      }
      return false
    })
    expect(hasContent).toBe(true)
  })

  test('canvas尺寸合理（宽>100, 高>80）', async ({ page }) => {
    const canvases = page.locator('.aa-chart-card canvas')
    const count = await canvases.count()
    for (let i = 0; i < count; i++) {
      const box = await canvases.nth(i).boundingBox()
      expect(box.width).toBeGreaterThan(100)
      expect(box.height).toBeGreaterThan(80)
    }
  })

  test('图表渲染无JS错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.waitForTimeout(1000)
    const g2Errors = errors.filter(e => e.includes('G2') || e.includes('chart') || e.includes('Canvas'))
    expect(g2Errors).toEqual([])
  })
})