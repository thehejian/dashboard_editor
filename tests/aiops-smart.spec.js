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
  await expect(section.locator('.smart-remed-item').first()).toBeVisible()

  const predTimes = await section.locator('.smart-pred-item .smart-pred-eta').allTextContents()
  const rawTimes = predTimes.map(t => t.match(/(\d+)分钟/)?.[1] || '0')
  expect(rawTimes.map(Number)).toEqual([...rawTimes.map(Number)].sort((a, b) => b - a))

  await section.locator('.ant-radio-button-wrapper', { hasText: '严重' }).click()
  await page.waitForTimeout(300)
  const criticalRows = await section.locator('.smart-table .ant-table-row').count()
  expect(criticalRows).toBeGreaterThan(0)
  expect(criticalRows).toBeLessThan(rows)
  await section.locator('.ant-radio-button-wrapper', { hasText: '全部' }).click()

  const apps = await page.locator('.app-card').count()
  expect(apps).toBe(24)

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
  await expect(drawer.locator('.fault-tabs')).toBeVisible()

  expect(errors).toEqual([])
})
