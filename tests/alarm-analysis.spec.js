import { test, expect } from '@playwright/test'

test.describe('告警分析页面', () => {
  test.beforeEach(async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
              { id: 2, time: '2026-08-20 13:20', alert: '内存不足', resource: 'server-02', action: '扩容', result: 'failed', duration: '60s', detail: '资源不足无法扩容', nodeLabel: 'server-02' },
            ],
          },
        }),
      })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { incident_no: 'INC-001', title: 'CPU负载过高触发自动扩容', level: 'critical', category: '容量类', status: 'investigating', handler: 'ai', affected_count: 3, related_alerts: [{ resource: 'server-01', level: 'critical', category: '计算' }] },
            { incident_no: 'INC-002', title: '数据库连接池耗尽', level: 'warning', category: '服务类', status: 'resolved', handler: 'manual', affected_count: 5, related_alerts: [{ resource: 'db-01', level: 'warning', category: '数据库' }] },
            { incident_no: 'INC-003', title: '证书即将过期', level: 'warning', category: '证书类', status: 'suppressed', handler: 'ai', affected_count: 2, related_alerts: [] },
            { incident_no: 'INC-004', title: '网络延迟超阈值', level: 'critical', category: '网络类', status: 'investigating', handler: null, affected_count: 8, related_alerts: [{ resource: 'switch-01', level: 'critical', category: '网络' }] },
            { incident_no: 'INC-005', title: '磁盘IO等待过高', level: 'info', category: '硬件类', status: 'resolved', handler: 'ai', affected_count: 1, related_alerts: [] },
            { incident_no: 'INC-006', title: '内存泄漏检测', level: 'warning', category: '服务类', status: 'investigating', handler: 'manual', affected_count: 4, related_alerts: [{ resource: 'app-01', level: 'warning', category: '应用' }] },
          ],
        }),
      })
    })
    page.__errors = errors
  })

  test('页面加载正常，G2 canvas 渲染', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })
    const canvases = page.locator('.aa-chart-card canvas')
    await expect(canvases).toHaveCount(3)
  })

  test('表格显示告警事件', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.ant-table', { timeout: 15000 })
    const rows = page.locator('.ant-table-tbody tr.ant-table-row')
    await expect(rows.first()).toBeVisible()
  })

  test('根因摘要是蓝色链接', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.aa-root-cause-link', { timeout: 15000 })
    const link = page.locator('.aa-root-cause-link').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveCSS('color', 'rgb(0, 125, 255)')
  })

  test('点击根因摘要跳转到故障详情', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.aa-root-cause-link', { timeout: 15000 })
    await page.locator('.aa-root-cause-link').first().click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/ops/incident/')
  })

  test('需关注应用卡片渲染', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.aiops-app-cards', { timeout: 15000 })
    await expect(page.locator('.app-card').first()).toBeVisible()
  })

  test('自动修复记录列表渲染', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForSelector('.aiops-healing-records', { timeout: 15000 })
    await expect(page.locator('.smart-remed-item').first()).toBeVisible()
  })
})