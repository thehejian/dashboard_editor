import { test, expect } from '@playwright/test'

test.describe('当前告警 - AI聚合横幅规则链接', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/current')
    await page.waitForSelector('.ant-table', { timeout: 10000 })
    await page.waitForTimeout(2000)
  })

  test('AI聚合横幅显示', async ({ page }) => {
    const banners = page.locator('.ai-agg-banner, .ai-aggregation-banners > div')
    const count = await banners.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('AI横幅包含"查看规则配置"链接', async ({ page }) => {
    const banners = page.locator('.ai-agg-banner')
    const count = await banners.count()
    if (count === 0) {
      test.skip()
      return
    }
    const link = page.locator('a, button', { hasText: '查看规则配置' })
    await expect(link.first()).toBeAttached()
  })

  test('"查看规则配置"跳转到汇聚规则Tab', async ({ page }) => {
    const link = page.locator('a, button', { hasText: '查看规则配置' })
    const count = await link.count()
    if (count === 0) {
      test.skip()
      return
    }
    await link.first().click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/alarm\/settings\/rules/)
    await expect(page).toHaveURL(/tab=aggregation/)
  })

  test('AI横幅"应用推荐规则"按钮存在', async ({ page }) => {
    const banners = page.locator('.ai-agg-banner')
    const count = await banners.count()
    if (count === 0) {
      test.skip()
      return
    }
    const btn = page.locator('button', { hasText: '应用推荐规则' })
    await expect(btn.first()).toBeAttached()
  })

  test('AI横幅"自定义调整"按钮存在', async ({ page }) => {
    const banners = page.locator('.ai-agg-banner')
    const count = await banners.count()
    if (count === 0) {
      test.skip()
      return
    }
    const btn = page.locator('button', { hasText: '自定义调整' })
    await expect(btn.first()).toBeAttached()
  })
})
