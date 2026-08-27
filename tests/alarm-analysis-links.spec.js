import { test, expect } from '@playwright/test'

test.describe('告警分析 - Drawer规则标签链接', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.ant-table', { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('告警分析页面加载', async ({ page }) => {
    await expect(page.locator('#app')).toBeAttached()
    const table = page.locator('.ant-table')
    await expect(table.first()).toBeAttached()
  })

  test('故障列表有数据行', async ({ page }) => {
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('点击受影响数量打开Drawer', async ({ page }) => {
    const countLink = page.locator('.aa-related-link').first()
    const count = await countLink.count()
    if (count === 0) {
      test.skip()
      return
    }
    await countLink.click()
    await page.waitForTimeout(1500)
    await expect(page.locator('.ant-drawer')).toBeAttached()
  })

  test('Drawer包含处理规则标签', async ({ page }) => {
    const countLink = page.locator('.aa-related-link').first()
    const count = await countLink.count()
    if (count === 0) {
      test.skip()
      return
    }
    await countLink.click()
    await page.waitForTimeout(1500)
    await expect(page.locator('.ant-drawer')).toBeAttached()
    const drawerText = await page.locator('.ant-drawer-body').textContent()
    expect(drawerText).toContain('规则')
  })
})
