import { test, expect } from '@playwright/test'

test.describe('Dashboard Editor Smoke Tests', () => {
  test('首页加载正常', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#app')).toBeAttached()
    await expect(page.locator('.nav-bar, .header, header, nav').first()).toBeAttached()
  })

  test('告警页面可访问', async ({ page }) => {
    await page.goto('/alarm/current')
    await expect(page.locator('#app')).toBeAttached()
  })

  test('监控拓扑页可访问', async ({ page }) => {
    await page.goto('/monitor/topology')
    await expect(page.locator('#app')).toBeAttached()
  })

  test('资源列表页可访问', async ({ page }) => {
    await page.goto('/resource/list')
    await expect(page.locator('#app')).toBeAttached()
  })
})
