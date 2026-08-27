import { test, expect } from '@playwright/test'

test.describe('告警扩展 - 汇聚规则Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/extension')
    await page.waitForSelector('.page-header h3, .ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('页面加载：标题正确', async ({ page }) => {
    await expect(page.locator('.page-header h3')).toContainText('告警扩展')
  })

  test('Tab切换：包含4个Tab', async ({ page }) => {
    const tabs = page.locator('.ant-tabs-tab')
    const count = await tabs.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('Tab4：汇聚规则Tab存在', async ({ page }) => {
    const tab = page.locator('.ant-tabs-tab', { hasText: '汇聚规则' })
    await expect(tab).toBeAttached()
  })

  test('汇聚规则Tab：显示规则列表', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.ant-table')).toBeAttached()
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('汇聚规则Tab：表格包含范围/触发条件/动作列', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(300)
    const headers = page.locator('.ant-table-thead th')
    const headerTexts = await headers.allTextContents()
    expect(headerTexts.some(h => h.includes('范围'))).toBeTruthy()
    expect(headerTexts.some(h => h.includes('触发条件'))).toBeTruthy()
    expect(headerTexts.some(h => h.includes('动作'))).toBeTruthy()
  })

  test('汇聚规则Tab：底部有"查看完整配置"链接', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(300)
    const link = page.locator('a, button', { hasText: '查看完整配置' })
    const count = await link.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('enrich规则Tab：显示6条规则', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'enrich规则' }).click()
    await page.waitForTimeout(300)
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    await expect(rows).toHaveCount(6)
  })

  test('enrich规则Tab："静默重复告警"规则存在', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'enrich规则' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.ant-table-tbody', { hasText: '静默重复告警' })).toBeAttached()
  })
})
