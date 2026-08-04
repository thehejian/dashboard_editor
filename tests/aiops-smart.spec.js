import { test, expect } from '@playwright/test'

test('aiops smart section renders and drawer opens from anomaly', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))

  await page.goto('/')
  await page.waitForTimeout(2500)

  const section = page.locator('.aiops-smart')
  await expect(section).toBeVisible()
  await expect(section.locator('.smart-item').first()).toBeVisible()

  const count = await section.locator('.smart-item').count()
  expect(count).toBeGreaterThan(0)

  await expect(section.locator('.smart-pred-item').first()).toBeVisible()
  await expect(section.locator('.smart-remed-item').first()).toBeVisible()

  const apps = await page.locator('.app-card').count()
  expect(apps).toBe(24)

  const overflow = await page.evaluate(() => {
    const el = document.querySelector('.aiops-smart')
    return { sw: el.scrollWidth, cw: el.clientWidth }
  })
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 2)

  await section.locator('.smart-item').first().click()
  await page.waitForTimeout(400)
  const drawer = page.locator('.app-drawer .detail-panel-content')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.app-summary')).toBeVisible()
  await expect(drawer.locator('.fault-tabs')).toBeVisible()

  expect(errors).toEqual([])
})
