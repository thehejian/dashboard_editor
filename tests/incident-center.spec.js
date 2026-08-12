import { test, expect } from '@playwright/test'

test.describe('故障中心侧边栏', () => {
  test('侧边栏树结构完整', async ({ page }) => {
    await page.goto('/ops/incidents')
    await expect(page.locator('.ic-sidebar')).toBeVisible()
    const titles = await page.locator('.ant-tree-title').allTextContents()
    expect(titles.join(',')).toContain('故障列表')
    expect(titles.join(',')).toContain('复盘记录')
    expect(titles.join(',')).toContain('自愈策略模板')
    expect(titles.join(',')).toContain('自愈执行记录')
    expect(titles.join(',')).toContain('故障趋势')
    expect(titles.join(',')).toContain('根因分析报告')
  })

  test('侧边栏点击跳转', async ({ page }) => {
    await page.goto('/ops/incidents')
    await page.click('.ant-tree-title:has-text("根因分析报告")')
    await expect(page).toHaveURL(/analysis\/rca/)
    await expect(page.locator('.page-header h3')).toHaveText('根因分析报告')
  })

  test('故障列表页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/list')
    await expect(page.locator('.page-header h3')).toHaveText('故障列表')
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 10000 })
  })

  test('复盘记录页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/postmortems')
    await expect(page.locator('.page-header h3')).toHaveText('复盘记录')
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 10000 })
  })

  test('自愈策略模板页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/config/templates')
    await expect(page.locator('.page-header h3')).toHaveText('自愈策略模板')
    await expect(page.locator('.tmpl-card').first()).toBeVisible({ timeout: 10000 })
  })

  test('自愈执行记录页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/config/records')
    await expect(page.locator('.page-header h3')).toHaveText('自愈执行记录')
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 10000 })
  })

  test('故障趋势页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/analysis/trend')
    await expect(page.locator('.page-header h3')).toHaveText('故障趋势')
    await expect(page.locator('.trend-summary-card').first()).toBeVisible({ timeout: 10000 })
  })

  test('根因分析报告页渲染', async ({ page }) => {
    await page.goto('/ops/incidents/analysis/rca')
    await expect(page.locator('.page-header h3')).toHaveText('根因分析报告')
    await expect(page.locator('.rca-card').first()).toBeVisible({ timeout: 10000 })
  })
})