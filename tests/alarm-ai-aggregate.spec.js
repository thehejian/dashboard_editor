import { test, expect } from '@playwright/test'

test.describe('AI 告警聚合功能', () => {
  // 注入重复告警数据，触发 ≥3 次聚合条件
  async function injectFrequentAlerts(page) {
    await page.evaluate(() => {
      if (!window.__realtimeAlerts) return
      const alerts = window.__realtimeAlerts.value
      const existingIds = new Set(alerts.map(a => a.id))
      const now = new Date()
      function h(minsAgo) {
        return new Date(now.getTime() - minsAgo * 60 * 1000).toLocaleString('zh-CN', { hour12: false })
      }
      const extra = [
        { id: 901, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-005 (华南区域)', metric: 'CPU使用率', currentValue: '93%', threshold: '> 90%', duration: '8分钟', displayDuration: '8分钟', durationMinutes: 8, triggerTime: h(12), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程', sourceSystem: 'Prometheus', cloudService: 'ECS', ip: '10.0.1.50', impact: '业务影响' },
        { id: 902, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-008 (华北区域)', metric: 'CPU使用率', currentValue: '91%', threshold: '> 90%', duration: '15分钟', displayDuration: '15分钟', durationMinutes: 15, triggerTime: h(25), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程', sourceSystem: 'Prometheus', cloudService: 'ECS', ip: '10.0.1.80', impact: '业务影响' },
        { id: 903, level: 'warning', title: 'CPU使用率超过90%', resource: 'server-012 (华东区域)', metric: 'CPU使用率', currentValue: '90%', threshold: '> 90%', duration: '3分钟', displayDuration: '3分钟', durationMinutes: 3, triggerTime: h(2), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程', sourceSystem: 'Prometheus', cloudService: 'ECS', ip: '10.0.1.120', impact: '业务影响' },
      ]
      for (const a of extra) {
        if (!existingIds.has(a.id)) alerts.push(a)
      }
      if (window.__triggerGrouping) window.__triggerGrouping()
    })
    await page.waitForTimeout(500)
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('http://admin:745544752@localhost:5173/alarm/current')
    await page.waitForSelector('.ant-table', { timeout: 10000 })
    await page.waitForTimeout(1000)
    await injectFrequentAlerts(page)
    await page.waitForTimeout(1000)
  })

  test('页面正常加载', async ({ page }) => {
    await expect(page.locator('#app')).toBeAttached()
    await expect(page.locator('.current-alerts')).toBeVisible()
  })

  test('显示 AI 聚合横幅', async ({ page }) => {
    const banners = page.locator('.ai-aggregation-banners')
    await expect(banners).toBeVisible()
    await expect(banners.first()).toContainText('CPU使用率超过90%')
  })

  test('横幅显示涉及资源列表', async ({ page }) => {
    const banner = page.locator('.ai-agg-banner').first()
    await expect(banner).toBeVisible()
    const resTags = banner.locator('.agg-res-tag')
    const count = await resTags.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('告警名称列显示 star badge', async ({ page }) => {
    const badges = page.locator('.ai-badge')
    await expect(badges.first()).toBeVisible()
    await expect(page.locator('.ai-badge-icon.fa-star').first()).toBeVisible()
  })

  test('hover 告警名称弹出 AI 推荐 tooltip', async ({ page }) => {
    const aiLink = page.locator('.ai-title-link').first()
    await expect(aiLink).toBeVisible()
    await aiLink.hover()
    await page.waitForTimeout(500)
    const tooltip = page.locator('.ant-tooltip-inner')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('发现重复告警模式')
    await expect(tooltip).toContainText('重复触发')
    await expect(tooltip).toContainText('建议抑制窗口')
    await expect(tooltip).toContainText('预估降噪效果')
    await expect(tooltip).toContainText('应用推荐规则')
    await expect(tooltip).toContainText('自定义调整')
    await expect(tooltip).toContainText('查看详情')
  })

  test('点击「执行 AI 聚合分析」调用后端接口', async ({ page }) => {
    // 先设置响应拦截
    const aggResponse = page.waitForResponse(
      resp => resp.url().includes('ai-aggregate') && resp.request().method() === 'POST',
      { timeout: 10000 }
    )
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
    await page.waitForTimeout(1000)

    const expandBtn = page.locator('.ai-agg-banner.aggregated button:has-text("展开")')
    await expect(expandBtn).toBeVisible()
    await expandBtn.click()
    await page.waitForTimeout(300)

    await expect(page.locator('.agg-detail-panel')).toBeVisible()
    await expect(page.locator('.agg-alert-row').first()).toBeVisible()
    await expect(page.locator('.agg-ai-result')).toBeVisible()
    await expect(page.locator('.agg-ai-result')).toContainText('CPU 飙升')
  })
})
