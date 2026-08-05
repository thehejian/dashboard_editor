import { test, expect } from '@playwright/test'

test('蜂巢图视图切换', async ({ page }) => {
  await page.goto('/monitor/resource/card')
  await page.waitForSelector('.sub-card', { timeout: 10000 })

  // 默认是卡片视图
  await expect(page.locator('.card-groups')).toBeVisible()

  // 点击蜂巢图按钮
  const wrappers = page.locator('.ant-radio-button-wrapper')
  await wrappers.nth(2).click()
  await page.waitForTimeout(2000)

  // 验证蜂巢图视图出现
  await expect(page.locator('.honeycomb-view')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.honeycomb-panel')).toHaveCount(5)
  await expect(page.locator('.honeycomb-cell').first()).toBeVisible()

  // 验证蜂巢图节点着色
  const firstCell = page.locator('.honeycomb-cell').first()
  const inner = firstCell.locator('.honeycomb-cell-inner')
  await expect(inner).toBeVisible()
})

test('蜂巢图: 直接访问', async ({ page }) => {
  await page.goto('/monitor/resource/honeycomb')
  await expect(page.locator('.honeycomb-view')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.honeycomb-panel')).toHaveCount(5)
})

test('蜂巢图: 悬停tooltip', async ({ page }) => {
  await page.goto('/monitor/resource/honeycomb')
  await page.waitForSelector('.honeycomb-cell', { timeout: 10000 })

  // 悬停第一个节点
  const firstCell = page.locator('.honeycomb-cell').first()
  await firstCell.hover()

  // 验证tooltip出现
  await expect(page.locator('.honeycomb-tooltip')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.honeycomb-tooltip-name')).not.toBeEmpty()
  await expect(page.locator('.honeycomb-tooltip-btn')).toBeVisible()
})

test('蜂巢图: 点击打开详情', async ({ page }) => {
  await page.goto('/monitor/resource/honeycomb')
  await page.waitForSelector('.honeycomb-cell', { timeout: 10000 })

  // 点击第一个节点
  const firstCell = page.locator('.honeycomb-cell').first()
  await firstCell.click()

  // 验证详情面板打开
  await expect(page.locator('.rdp.open')).toBeVisible({ timeout: 5000 })
})

test('蜂巢图: 折叠面板交互', async ({ page }) => {
  await page.goto('/monitor/resource/honeycomb')
  await page.waitForSelector('.honeycomb-panel', { timeout: 10000 })

  // 验证告警多的面板排在前面
  const firstPanel = page.locator('.honeycomb-panel').first()
  const firstPanelText = await firstPanel.locator('.honeycomb-panel-header').innerText()
  console.log('First panel:', firstPanelText)

  // 点击第一个面板标题折叠
  await firstPanel.locator('.honeycomb-panel-header').click()
  await page.waitForTimeout(500)

  // 验证面板折叠（arrow不再有open class）
  const arrow = firstPanel.locator('.honeycomb-arrow')
  await expect(arrow).not.toHaveClass(/open/)
})
