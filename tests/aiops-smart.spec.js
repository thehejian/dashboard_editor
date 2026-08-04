import { test, expect } from '@playwright/test'

test('aiops smart section renders and drawer opens from anomaly', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))

  await page.goto('/')
  await page.waitForTimeout(2500)

  const section = page.locator('.aiops-smart')
  await expect(section).toBeVisible()
  await expect(section.locator('.smart-table')).toBeVisible()
  await expect(section.locator('.smart-table .ant-table-row').first()).toBeVisible()

  const rows = await section.locator('.smart-table .ant-table-row').count()
  expect(rows).toBeGreaterThan(0)

  await expect(section.locator('.smart-table th', { hasText: '得分' })).toBeVisible()
  await expect(section.locator('.smart-table th', { hasText: '时间' })).toBeVisible()
  await expect(section.locator('.smart-table th', { hasText: '级别' })).toBeVisible()

  await expect(section.locator('.smart-pred-item').first()).toBeVisible()
  await expect(section.locator('.smart-remed-row')).toBeVisible()
  await expect(section.locator('.smart-remed-item').first()).toBeVisible()

  const predItem = section.locator('.smart-pred-item').first()
  await predItem.click()
  await page.waitForTimeout(400)
  await expect(page.locator('.app-drawer.open')).toHaveCount(1)
  await page.locator('.app-drawer .close-btn').click()
  await page.waitForTimeout(400)
  await expect(page.locator('.app-drawer.open')).toHaveCount(0)

  const remedItem = section.locator('.smart-remed-item').first()
  await remedItem.click()
  await page.waitForTimeout(400)
  await expect(page.locator('.app-drawer.open')).toHaveCount(1)
  await page.locator('.app-drawer .close-btn').click()
  await page.waitForTimeout(400)
  await expect(page.locator('.app-drawer.open')).toHaveCount(0)

  const predTimes = await section.locator('.smart-pred-item .smart-pred-eta').allTextContents()
  const rawTimes = predTimes.map(t => t.match(/(\d+)分钟/)?.[1] || '0')
  expect(rawTimes.map(Number)).toEqual([...rawTimes.map(Number)].sort((a, b) => b - a))

  await section.locator('.ant-radio-button-wrapper', { hasText: '严重' }).click()
  await page.waitForTimeout(300)
  const criticalRows = await section.locator('.smart-table .ant-table-row').count()
  expect(criticalRows).toBeGreaterThan(0)
  expect(criticalRows).toBeLessThan(rows)

  const apps = await page.locator('.app-card').count()
  expect(apps).toBe(8)
  await expect(page.locator('.aiops-heatmap .ab-badge.ab-critical')).toHaveText('严重 1')
  await expect(page.locator('.aiops-heatmap .ab-badge.ab-warning')).toHaveText('警告 7')

  await page.locator('.title-toggle .ant-radio-button-wrapper', { hasText: '全部' }).click()
  await page.waitForTimeout(300)
  expect(await page.locator('.app-card').count()).toBe(24)
  await page.locator('.title-toggle .ant-radio-button-wrapper', { hasText: '仅异常' }).click()

  const overflow = await page.evaluate(() => {
    const el = document.querySelector('.aiops-smart')
    return { sw: el.scrollWidth, cw: el.clientWidth }
  })
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 2)

  await section.locator('.smart-table .ant-table-row').first().click()
  await page.waitForTimeout(400)
  const drawer = page.locator('.app-drawer .detail-panel-content')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.app-summary')).toBeVisible()
  await expect(drawer.locator('.app-summary-trend')).toBeVisible()
  await expect(drawer.locator('.app-summary-badges')).toBeVisible()
  await expect(drawer.locator('.app-meta-chip')).toHaveCount(4)
  await expect(drawer.locator('.app-summary-tip')).toBeVisible()
  await expect(drawer.locator('.fault-tabs')).toBeVisible()

  await page.locator('.app-drawer .close-btn').click()
  await page.waitForTimeout(400)
  await expect(page.locator('.app-drawer.open')).toHaveCount(0)
  const rowsAfterClose = await section.locator('.smart-table .ant-table-row').count()
  expect(rowsAfterClose).toBe(criticalRows)

  expect(errors).toEqual([])
})
