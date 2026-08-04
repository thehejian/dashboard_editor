import { test, expect } from '@playwright/test'

const PAGE = '/monitor/resource/card'

test('过滤器面板：收起/展开 + 范围切换 + 过滤联动', async ({ page }) => {
  await page.goto(PAGE)
  await page.waitForSelector('.sub-card', { timeout: 10000 })

  // 过滤器面板可见
  await expect(page.locator('.filter-panel')).toBeVisible()
  await expect(page.locator('.filter-panel-title')).toHaveText('过滤器')

  // 资源范围三个选项
  const scopeItems = page.locator('.filter-scope-item')
  await expect(scopeItems).toHaveCount(3)
  await expect(scopeItems.nth(0)).toContainText('全部资源')
  await expect(scopeItems.nth(1)).toContainText('关注资源')
  await expect(scopeItems.nth(2)).toContainText('最近访问')

  // 模块 5 项
  const moduleItems = page.locator('.filter-check-item')
  const moduleCount = await page.locator('.filter-section').nth(1).locator('.filter-check-item').count()
  expect(moduleCount).toBe(5)

  // 收起面板
  await page.locator('.filter-collapse-btn').click()
  await expect(page.locator('.filter-panel')).toHaveClass(/collapsed/)
  await expect(page.locator('.filter-panel-inner')).toHaveCount(0)
  // 展开
  await page.locator('.filter-expand-btn').click()
  await expect(page.locator('.filter-panel-inner')).toBeVisible()

  // 切到最近访问范围 → 显示最近访问视图
  await scopeItems.nth(2).click()
  await expect(page.locator('.recent-view-title')).toHaveText('最近访问')
  // 切回全部资源
  await scopeItems.nth(0).click()
  await expect(page.locator('.recent-view')).toHaveCount(0)
})

test('模块过滤：勾选后卡片组与计数联动', async ({ page }) => {
  await page.goto(PAGE)
  await page.waitForSelector('.sub-card', { timeout: 10000 })

  const groupsBefore = await page.locator('.card-group:visible').count()
  expect(groupsBefore).toBeGreaterThan(1)

  // 勾选「业务应用」模块
  const appFilter = page.locator('.filter-section').nth(1).locator('.filter-check-item').filter({ hasText: '业务应用' })
  await appFilter.click()
  await expect(appFilter).toHaveClass(/active/)

  // 只显示业务应用一组
  await expect(page.locator('.card-group:visible')).toHaveCount(1)
  await expect(page.locator('.card-group:visible .group-title')).toHaveText('业务应用')

  // 点业务应用下有数据的子卡片（重要应用）跳转 → 列表仍带模块过滤
  const subCard = page.locator('.card-group:visible .sub-card').filter({ hasText: '重要应用' })
  await expect(subCard).toBeVisible()
  await subCard.click()
  await page.waitForTimeout(1200)
  await expect(page).toHaveURL(/\/monitor\/resource\/app\?sub=/)
  const rows = await page.locator('.ant-table-tbody tr.ant-table-row').count()
  expect(rows).toBeGreaterThan(0)
})

test('点击资源打开详情 → 记录最近访问 + 可关注', async ({ page }) => {
  await page.goto(PAGE)
  await page.waitForSelector('.sub-card', { timeout: 10000 })

  // 打开一个资源详情（通过列表）
  await page.goto('/monitor/resource/list')
  await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
  const firstRow = page.locator('.ant-table-tbody tr.ant-table-row').first()
  const name = (await firstRow.locator('.app-link').innerText()).trim()
  await firstRow.locator('.app-link').click()
  await expect(page.locator('.rdp-content')).toBeVisible()
  await expect(page.locator('.rdp-header-left h3')).toContainText(name)

  // 详情面板内点关注
  const focusBtn = page.locator('.rdp-focus-btn')
  await focusBtn.click()
  await expect(focusBtn).toHaveClass(/active/)

  // 关闭详情
  await page.locator('.rdp-close').click()

  // 回卡片页 → 顶部出现最近访问条，且该资源在其中
  await page.goto(PAGE)
  await page.waitForSelector('.recent-bar', { timeout: 10000 })
  await expect(page.locator('.recent-item .recent-name').first()).toContainText(name)

  // 关注资源范围计数为 1
  await expect(page.locator('.filter-scope-item').nth(1).locator('.filter-scope-count')).toHaveText('1')
})

test('分组关注：悬停卡片出现 icon、点击高亮、刷新持久化', async ({ page }) => {
  await page.goto(PAGE)
  await page.waitForSelector('.card-group', { timeout: 10000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.card-group', { timeout: 10000 })

  const group = page.locator('.card-group').first()
  const groupTitle = (await group.locator('.group-title').innerText()).trim()
  const btn = group.locator('.group-focus-btn')

  // 未悬停时 icon 隐藏
  await expect(btn).toHaveCSS('opacity', '0')

  // 悬停整张分组卡片（非标题行）→ icon 出现
  await group.hover()
  await expect(btn).toHaveCSS('opacity', '1')

  // 点击 → 高亮
  await btn.click()
  await expect(btn).toHaveClass(/active/)

  // 刷新后仍高亮（localStorage 持久化）
  await page.reload()
  await page.waitForSelector('.card-group', { timeout: 10000 })
  const persistedBtn = page.locator('.card-group').first().locator('.group-focus-btn')
  await expect(persistedBtn).toHaveClass(/active/)

  // 再点一次取消关注
  await persistedBtn.click()
  await expect(persistedBtn).not.toHaveClass(/active/)

  console.log('分组关注验证通过:', groupTitle)
})
