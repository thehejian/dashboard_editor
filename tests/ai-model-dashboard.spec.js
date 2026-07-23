import { test, expect } from '@playwright/test'

test.describe('AI模型监控 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/aimodel')
    await page.waitForSelector('.ai-dashboard', { timeout: 10000 })
  })

  test('页面加载正常，核心容器存在', async ({ page }) => {
    await expect(page.locator('.ai-dashboard')).toBeAttached()
    await expect(page.locator('.ai-toolbar')).toBeAttached()
    await expect(page.locator('.ai-row-agnes')).toBeAttached()
    await expect(page.locator('.ai-row-other')).toBeAttached()
  })

  test('Agnes 3 卡片一行，SenseNova + Zhipu 另一行', async ({ page }) => {
    const agnesCards = page.locator('.ai-row-agnes .ai-provider-card')
    await expect(agnesCards).toHaveCount(3)
    const otherCards = page.locator('.ai-row-other .ai-provider-card')
    await expect(otherCards).toHaveCount(2)
  })

  test('点击测试连接后逐条显示结果', async ({ page }) => {
    const testBtn = page.locator('.ai-test-btn')
    await expect(testBtn).toBeAttached()
    await testBtn.click()
    // Wait for at least one model to finish (status tag changes from 'testing' to '正常' or '异常')
    await page.waitForFunction(() => {
      const tags = document.querySelectorAll('.ai-status-tag')
      return Array.from(tags).some(t => t.textContent === '正常' || t.textContent === '异常')
    }, { timeout: 60000 })
    // Verify some results populated
    const resultRows = page.locator('.ai-model-table tbody tr')
    const count = await resultRows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Agnes 模型应有正常结果', async ({ page }) => {
    const testBtn = page.locator('.ai-test-btn')
    await testBtn.click()
    // Wait for at least one success
    await page.waitForFunction(() => {
      const tags = document.querySelectorAll('.ai-status-success')
      return tags.length > 0
    }, { timeout: 60000 })
    // Verify metadata pills show count
    const okPills = page.locator('.ai-stat-ok')
    const pillCount = await okPills.count()
    expect(pillCount).toBeGreaterThanOrEqual(1)
  })

  test('单模型测试按钮存在且可见', async ({ page }) => {
    await page.waitForSelector('.ai-single-test-btn', { timeout: 10000 })
    const btns = page.locator('.ai-single-test-btn')
    const count = await btns.count()
    expect(count).toBe(16)
  })
})
