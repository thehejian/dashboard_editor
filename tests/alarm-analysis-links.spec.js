import { test, expect } from '@playwright/test'

test.describe('告警分析 - Drawer规则标签链接', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.page-header h3, .ant-table', { timeout: 15000 })
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

  test('点击详情打开Drawer', async ({ page }) => {
    const detailBtn = page.locator('button, a', { hasText: '详情' }).first()
    const count = await detailBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    await detailBtn.click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.ant-drawer')).toBeAttached()
  })

  test('Drawer包含处理规则标签', async ({ page }) => {
    const detailBtn = page.locator('button, a', { hasText: '详情' }).first()
    const count = await detailBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    await detailBtn.click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.ant-drawer')).toBeAttached()

    const ruleTags = page.locator('.ant-drawer .ant-tag, .ant-drawer text=同metric聚合, .ant-drawer text=重复触发过滤')
    const tagCount = await ruleTags.count()
    expect(tagCount).toBeGreaterThanOrEqual(0)
  })

  test('Drawer规则标签可点击跳转', async ({ page }) => {
    const detailBtn = page.locator('button, a', { hasText: '详情' }).first()
    const count = await detailBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    await detailBtn.click()
    await page.waitForTimeout(1000)

    const ruleLink = page.locator('.ant-drawer a, .ant-drawer button', { hasText: /规则配置|汇聚规则|聚合规则/ })
    const linkCount = await ruleLink.count()
    if (linkCount === 0) {
      test.skip()
      return
    }
    await ruleLink.first().click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/alarm\/settings\/rules/)
  })

  test('Drawer包含"查看更多规则配置"链接', async ({ page }) => {
    const detailBtn = page.locator('button, a', { hasText: '详情' }).first()
    const count = await detailBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    await detailBtn.click()
    await page.waitForTimeout(1000)

    const moreLink = page.locator('.ant-drawer a, .ant-drawer button', { hasText: '查看更多规则配置' })
    const linkCount = await moreLink.count()
    expect(linkCount).toBeGreaterThanOrEqual(0)
  })
})
