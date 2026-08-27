import { test, expect } from '@playwright/test'

test.describe('告警规则配置 - 汇聚规则', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/rules')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(1000)
  })

  test('页面加载：标题和基础结构', async ({ page }) => {
    await expect(page.locator('.page-header h3')).toContainText('汇聚规则')
    await expect(page.locator('.ant-tabs')).toBeAttached()
  })

  test('Tab切换：检测规则 / 汇聚规则 / AI优化建议', async ({ page }) => {
    const tabs = page.locator('.ant-tabs-tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toContainText('检测规则')
    await expect(tabs.nth(1)).toContainText('汇聚规则')
    await expect(tabs.nth(2)).toContainText('AI优化建议')
  })

  test('检测规则Tab：默认显示16条规则(分页)', async ({ page }) => {
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    await expect(rows).toHaveCount(10)
    await expect(page.locator('.ant-pagination-total-text')).toContainText('共 16 条')
  })

  test('汇聚规则Tab：显示汇聚规则列表', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(1000)
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('AI优化建议Tab：显示AI分析概览', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ai-overview')).toBeAttached()
    await expect(page.locator('.ai-overview')).toContainText('AI已分析')
  })

  test('AI优化建议Tab：显示3条建议卡片', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    const cards = page.locator('.suggestion-card')
    await expect(cards).toHaveCount(3)
  })

  test('AI优化建议Tab：建议卡片有采纳/忽略按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.suggestion-card').first().locator('button', { hasText: '采纳' })).toBeAttached()
    await expect(page.locator('.suggestion-card').first().locator('button', { hasText: '忽略' })).toBeAttached()
  })

  test('汇聚规则Tab：新建汇聚规则按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    const btn = page.locator('button', { hasText: '新建汇聚规则' })
    await expect(btn).toBeAttached()
  })

  test('汇聚规则Drawer：点击新建打开Drawer', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer')).toBeAttached()
    await expect(page.locator('.ant-drawer-title')).toContainText('汇聚规则')
  })

  test('汇聚规则Drawer：包含4个面板', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer-body', { hasText: '基本信息' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '条件' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '汇聚参数' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '汇聚动作' })).toBeAttached()
  })

  test('汇聚规则Drawer：AI影响预估区域', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer-body', { hasText: 'AI影响预估' })).toBeAttached()
  })

  test('汇聚规则Drawer：底部AI校验并保存按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    const drawer = page.locator('.ant-drawer')
    await expect(drawer.locator('.ant-drawer-footer')).toBeAttached()
    await expect(drawer.locator('.ant-drawer-footer').locator('button')).toHaveCount(2)
  })
})
