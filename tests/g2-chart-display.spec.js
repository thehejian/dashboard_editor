import { test, expect } from '@playwright/test'

const MOCK_OVERVIEW_STATS = {
  success: true,
  data: {
    heroStats: { closedCount: 128, reductionRate: 76, autoRate: 42, savedHours: 96 },
    categoryStats: [
      { category: '容量类', pct: 32 }, { category: '阈值类', pct: 28 },
      { category: '网络类', pct: 18 }, { category: '证书类', pct: 12 },
      { category: '服务类', pct: 8 }, { category: '硬件类', pct: 2 },
    ],
    funnelData: { raw: 1200, dedup: 1020, agg: 504, rate: 58 },
    healingRecords: [
      { id: 1, time: '2026-08-20 14:30', alert: 'CPU高负载', resource: 'server-01', action: '重启服务', result: 'success', duration: '45s', detail: '自动重启nginx服务成功', nodeLabel: 'server-01' },
    ],
  },
}

const MOCK_INCIDENTS = {
  success: true,
  data: [
    { incident_no: 'INC-001', title: 'CPU负载过高', level: 'critical', category: '容量类', status: 'investigating', handler: 'ai', affected_count: 3, related_alerts: [{ resource: 's1', level: 'critical', category: '计算' }] },
    { incident_no: 'INC-002', title: 'DB连接池耗尽', level: 'warning', category: '服务类', status: 'resolved', handler: 'manual', affected_count: 5, related_alerts: [] },
  ],
}

test.describe('SVG 图表渲染检测', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('3个图表卡片各有1个SVG元素', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    await expect(chartCards).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      await expect(chartCards.nth(i).locator('svg')).toHaveCount(1)
    }
  })

  test('TopN 图 SVG 包含分类标签', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(0).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('容量类')
    expect(text).toContain('阈值类')
    expect(text).toContain('网络类')
    expect(text).toContain('证书类')
    expect(text).toContain('服务类')
    expect(text).toContain('硬件类')
  })

  test('TopN 图 SVG 包含百分比数值', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(0).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('32%')
    expect(text).toContain('28%')
    expect(text).toContain('18%')
  })

  test('TopN 图 SVG 包含 rect 元素', async ({ page }) => {
    const rects = page.locator('.aa-chart-card').nth(0).locator('svg rect')
    await expect(rects.first()).toBeVisible()
  })

  test('漏斗图 SVG 包含步骤名', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(1).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('原始告警')
    expect(text).toContain('频次去重')
    expect(text).toContain('拓扑聚合')
    expect(text).toContain('有效事件')
  })

  test('漏斗图 SVG 包含数值', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(1).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('1,200')
    expect(text).toContain('1,020')
    expect(text).toContain('504')
  })

  test('趋势图 SVG 包含日期标签', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(2).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('06-11')
    expect(text).toContain('06-17')
  })

  test('趋势图 SVG 包含图例', async ({ page }) => {
    const svg = page.locator('.aa-chart-card').nth(2).locator('svg')
    const text = await svg.textContent()
    expect(text).toContain('AI处理')
    expect(text).toContain('人工处理')
  })

  test('趋势图 SVG 包含 polyline 折线', async ({ page }) => {
    const polylines = page.locator('.aa-chart-card').nth(2).locator('svg polyline')
    await expect(polylines).toHaveCount(2)
  })

  test('页面无 JS 错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.waitForTimeout(1000)
    const svgErrors = errors.filter(e => e.includes('SVG') || e.includes('chart') || e.includes('render'))
    expect(svgErrors).toEqual([])
  })
})