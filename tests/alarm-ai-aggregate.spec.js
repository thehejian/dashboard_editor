import { test, expect } from '@playwright/test'

test.describe('AI 告警聚合功能', () => {
  async function setupMockAggregatableData(page) {
    const now = new Date()
    function h(minsAgo) {
      const d = new Date(now.getTime() - minsAgo * 60 * 1000)
      return d.toISOString().replace('Z', '+08:00')
    }
    const baseData = [
      { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', metric: 'CPU使用率', current_value: '95%', threshold: '> 90%', duration: '5分钟', display_duration: '5分钟', duration_minutes: 5, trigger_time: h(5), recovery_time: null, status: 'firing', suggestion: '检查异常进程' },
      { id: 2, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', metric: '响应时间', current_value: '2500ms', threshold: '> 2000ms', duration: '1小时', display_duration: '1小时', duration_minutes: 60, trigger_time: h(60), recovery_time: null, status: 'firing', suggestion: '检查下游服务' },
      { id: 201, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-005 (华南区域)', metric: 'CPU使用率', current_value: '93%', threshold: '> 90%', duration: '8分钟', display_duration: '8分钟', duration_minutes: 8, trigger_time: h(12), recovery_time: null, status: 'firing', suggestion: '检查异常进程' },
      { id: 202, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-008 (华北区域)', metric: 'CPU使用率', current_value: '91%', threshold: '> 90%', duration: '15分钟', display_duration: '15分钟', duration_minutes: 15, trigger_time: h(25), recovery_time: null, status: 'firing', suggestion: '检查异常进程' },
      { id: 203, level: 'warning', title: 'CPU使用率超过90%', resource: 'server-012 (华东区域)', metric: 'CPU使用率', current_value: '90%', threshold: '> 90%', duration: '3分钟', display_duration: '3分钟', duration_minutes: 3, trigger_time: h(2), recovery_time: null, status: 'firing', suggestion: '检查异常进程' },
    ]
    await page.route('**/api/cmdb/alerts**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: baseData }) })
    })
  }

  test.beforeEach(async ({ page }) => {
    await setupMockAggregatableData(page)
    await page.goto('/alarm/current')
    await page.waitForSelector('.ant-table', { timeout: 10000 })
  })

  test('页面正常加载', async ({ page }) => {
    await expect(page.locator('#app')).toBeAttached()
    await expect(page.locator('.current-alerts')).toBeVisible()
  })

  test('显示 AI 聚合横幅', async ({ page }) => {
    await page.waitForTimeout(1500)
    const banners = page.locator('.ai-aggregation-banners')
    await expect(banners).toBeVisible()
    await expect(banners.first()).toContainText('CPU使用率超过90%')
  })

  test('横幅显示涉及资源列表', async ({ page }) => {
    await page.waitForTimeout(1500)
    const banner = page.locator('.ai-agg-banner').first()
    await expect(banner).toBeVisible()
    const resTags = banner.locator('.agg-res-tag')
    await expect(resTags).toHaveCount(4)
  })

  test('告警名称列显示火焰 badge', async ({ page }) => {
    await page.waitForTimeout(1500)
    const badges = page.locator('.ai-badge')
    await expect(badges).toBeVisible()
    await expect(badges.first()).toContainText('4')
    await expect(page.locator('.ai-badge-icon')).toBeVisible()
  })

  test('hover 告警名称弹出 AI 推荐 tooltip', async ({ page }) => {
    await page.waitForTimeout(1500)
    const aiLink = page.locator('.ai-title-link')
    await expect(aiLink).toBeVisible()
    await aiLink.first().hover()
    await page.waitForTimeout(500)
    const tooltip = page.locator('.ant-tooltip-inner')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('AI 智能聚合推荐')
    await expect(tooltip).toContainText('近1小时内同类告警触发')
    await expect(tooltip).toContainText('执行 AI 聚合分析')
  })

  test('点击「执行 AI 聚合分析」调用后端接口', async ({ page }) => {
    await page.waitForTimeout(1500)

    const aggResponse = page.waitForResponse(
      resp => resp.url().includes('ai-aggregate') && resp.request().method() === 'POST',
      { timeout: 10000 }
    )

    const btn = page.locator('.ai-agg-banner').first().locator('button:has-text("AI 聚合降噪")')
    await expect(btn).toBeVisible()
    await btn.click()
    await aggResponse

    await page.waitForTimeout(500)
    const aggregatedBanner = page.locator('.ai-agg-banner.aggregated')
    await expect(aggregatedBanner).toBeVisible()
    await expect(page.locator('.ai-agg-banner').first().locator('button:has-text("展开")')).toBeVisible()
  })

  test('聚合后展开面板显示告警列表和 AI 分析结果', async ({ page }) => {
    await page.waitForTimeout(1500)

    await page.route('**/api/alarm/ai-aggregate**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            rootCause: '华北区域批量任务并发执行导致 CPU 飙升',
            suggestions: ['检查 crontab 定时任务', '限制并发任务数量', '必要时扩容'],
            incidentId: null,
          },
        }),
      })
    })

    const banner = page.locator('.ai-agg-banner').first()
    await banner.locator('button:has-text("AI 聚合降噪")').click()
    await page.waitForTimeout(800)

    const expandBtn = page.locator('.ai-agg-banner.aggregated button:has-text("展开")')
    await expect(expandBtn).toBeVisible()
    await expandBtn.click()
    await page.waitForTimeout(300)

    await expect(page.locator('.agg-detail-panel')).toBeVisible()
    await expect(page.locator('.agg-alert-row')).toBeVisible()
    await expect(page.locator('.agg-ai-result')).toBeVisible()
    await expect(page.locator('.agg-ai-result')).toContainText('CPU 飙升')
  })
})
