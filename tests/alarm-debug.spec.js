import { test, expect } from '@playwright/test'

test('debug aggregate state v2', async ({ page }) => {
  await page.goto('http://admin:745544752@localhost:5173/alarm/current')
  await page.waitForSelector('.ant-table', { timeout: 10000 })
  await page.waitForTimeout(1000)

  // inject
  await page.evaluate(() => {
    if (!window.__realtimeAlerts) return
    const alerts = window.__realtimeAlerts.value
    const existingIds = new Set(alerts.map(a => a.id))
    const now = new Date()
    function h(minsAgo) {
      return new Date(now.getTime() - minsAgo * 60 * 1000).toLocaleString('zh-CN', { hour12: false })
    }
    const extra = [
      { id: 901, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-005 (华南区域)', metric: 'CPU使用率', currentValue: '93%', threshold: '> 90%', duration: '8分钟', displayDuration: '8分钟', durationMinutes: 8, triggerTime: h(12), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程' },
      { id: 902, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-008 (华北区域)', metric: 'CPU使用率', currentValue: '91%', threshold: '> 90%', duration: '15分钟', displayDuration: '15分钟', durationMinutes: 15, triggerTime: h(25), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程' },
      { id: 903, level: 'warning', title: 'CPU使用率超过90%', resource: 'server-012 (华东区域)', metric: 'CPU使用率', currentValue: '90%', threshold: '> 90%', duration: '3分钟', displayDuration: '3分钟', durationMinutes: 3, triggerTime: h(2), recoveryTime: '-', status: 'firing', suggestion: '检查异常进程' },
    ]
    for (const a of extra) {
      if (!existingIds.has(a.id)) alerts.push(a)
    }
    if (window.__triggerGrouping) window.__triggerGrouping()
  })
  await page.waitForTimeout(1000)

  // Check banners exist before click
  const beforeCount = await page.locator('.ai-agg-banner').count()
  console.log('Banners before click:', beforeCount)

  // intercept
  await page.route('**/api/alarm/ai-aggregate**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { rootCause: 'test', suggestions: ['a'], incidentId: null } }),
    })
  })

  const btn = page.locator('.ai-agg-banner').first().locator('button:has-text("AI 聚合降噪")')
  await btn.click()
  await page.waitForTimeout(2000)

  // Check state after click
  const afterState = await page.evaluate(() => {
    const banners = document.querySelectorAll('.ai-agg-banner')
    const aggBanners = document.querySelectorAll('.ai-agg-banner.aggregated')
    const btnText = document.querySelector('.ai-agg-banner button')?.textContent?.trim() || 'none'
    return {
      bannersCount: banners.length,
      aggregatedCount: aggBanners.length,
      buttonText: btnText,
      bannerClasses: Array.from(banners).map(b => b.className),
    }
  })
  console.log('After click state:', JSON.stringify(afterState))

  // Check page console messages
  const messages = await page.evaluate(() => {
    return window.__testMessages || []
  })
  console.log('Messages:', messages)
})
