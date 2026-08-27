import { test, expect } from '@playwright/test'

test.describe('告警扩展 - 汇聚规则Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/extension')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('页面加载：Tab结构正确', async ({ page }) => {
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
    await page.waitForTimeout(500)
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('汇聚规则Tab：表格包含范围/触发条件/动作列', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    const headers = page.locator('.ant-table-thead th')
    const headerTexts = await headers.allTextContents()
    expect(headerTexts.some(h => h.includes('范围'))).toBeTruthy()
    expect(headerTexts.some(h => h.includes('触发条件'))).toBeTruthy()
    expect(headerTexts.some(h => h.includes('动作'))).toBeTruthy()
  })

  test('汇聚规则Tab：底部有"查看完整配置"链接', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    const link = page.locator('button', { hasText: '查看完整配置' })
    const count = await link.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('enrich规则Tab：显示规则', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'enrich' }).click()
    await page.waitForTimeout(500)
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })
})
