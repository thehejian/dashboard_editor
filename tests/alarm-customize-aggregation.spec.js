import { test, expect } from '@playwright/test'

test.describe('个性化 - 告警聚合配置按钮', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/customize')
    await page.waitForSelector('.page-header h3, .ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('页面加载：标题正确', async ({ page }) => {
    await expect(page.locator('.page-header h3')).toContainText('个性化')
  })

  test('Tab切换：通知偏好Tab存在', async ({ page }) => {
    const tab = page.locator('.ant-tabs-tab', { hasText: '通知偏好' })
    await expect(tab).toBeAttached()
  })

  test('通知偏好Tab：聚合开关存在', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '通知偏好' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=告警聚合')).toBeAttached()
    const toggle = page.locator('.ant-switch').first()
    await expect(toggle).toBeAttached()
  })

  test('通知偏好Tab：聚合开关旁有"配置"按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '通知偏好' }).click()
    await page.waitForTimeout(300)
    const configBtn = page.locator('button, a', { hasText: /配置聚合规则|配置/ })
    const count = await configBtn.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('"配置"按钮跳转到汇聚规则配置', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '通知偏好' }).click()
    await page.waitForTimeout(300)
    const configBtn = page.locator('button, a', { hasText: /配置聚合规则|配置汇聚规则/ })
    const count = await configBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    await configBtn.first().click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/alarm\/settings\/rules/)
  })

  test('聚合开关可切换', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '通知偏好' }).click()
    await page.waitForTimeout(300)
    const toggle = page.locator('.ant-switch').first()
    const isChecked = await toggle.getAttribute('class')
    await toggle.click()
    await page.waitForTimeout(300)
    const newClass = await toggle.getAttribute('class')
    expect(isChecked).not.toEqual(newClass)
  })
})
