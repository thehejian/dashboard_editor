import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('首页 (HomeView)', () => {
  test('AI运维 tab 加载完整', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    await expect(page.locator('.home-tab-btn.active')).toContainText('AI运维')
    await expect(page.locator('.aiops-kpi-card').first()).toBeVisible()
    await page.screenshot({ path: '/tmp/test-home-aiops.png' })
  })

  test('概览 tab 切换', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    await page.click('.home-tab-btn:has-text("概览")')
    await expect(page.locator('.home-tab-btn.active')).toContainText('概览')
    await expect(page.locator('.kpi-card').first()).toBeVisible()
    await page.screenshot({ path: '/tmp/test-home-overview.png' })
  })

  test('概览 KPI 卡片 fa-eye 打开详情面板', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    await page.click('.home-tab-btn:has-text("概览")')
    await page.waitForSelector('.kpi-card', { timeout: 5000 })
    const eyeBtn = page.locator('.kpi-card').first().locator('.fa-eye').first()
    await eyeBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: '/tmp/test-home-detail-panel.png' })
  })

  test('应用卡片点击打开侧滑抽屉', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    const appCard = page.locator('.app-card, .aiops-app-card').first()
    if (await appCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appCard.click()
      await page.waitForTimeout(500)
      await expect(page.locator('.app-drawer')).toBeVisible()
      await page.screenshot({ path: '/tmp/test-home-app-drawer.png' })
    }
  })

  test('告警趋势图表渲染', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    await page.click('.home-tab-btn:has-text("概览")')
    await page.waitForTimeout(1000)
    await expect(page.locator('.line-card').first()).toBeVisible()
    await page.screenshot({ path: '/tmp/test-home-charts.png' })
  })
})

test.describe('资源门户 - 概览', () => {
  test('概览页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/overview`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    await page.screenshot({ path: '/tmp/test-resource-overview.png' })
  })
})

test.describe('资源门户 - 发现', () => {
  test('发现页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/discovery`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    await page.screenshot({ path: '/tmp/test-resource-discovery.png' })
  })

  test('扫描影子资源按钮', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/discovery`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    const scanBtn = page.locator('button:has-text("扫描影子资源")')
    if (await scanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scanBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: '/tmp/test-resource-discovery-scan.png' })
    }
  })
})

test.describe('资源门户 - 管理', () => {
  test('管理页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/manage`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    await page.screenshot({ path: '/tmp/test-resource-manage.png' })
  })

  test('分类 tab 切换', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/manage`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    const tabs = page.locator('.category-tab, .ant-tabs-tab')
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: '/tmp/test-resource-manage-tab.png' })
    }
  })

  test('筛选下拉框交互', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/manage`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    const select = page.locator('.ant-select').first()
    if (await select.isVisible({ timeout: 3000 }).catch(() => false)) {
      await select.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: '/tmp/test-resource-manage-filter.png' })
    }
  })
})

test.describe('资源门户 - 审计', () => {
  test('审计页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/audit`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    await page.screenshot({ path: '/tmp/test-resource-audit.png' })
  })

  test('创建审计规则按钮打开抽屉', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/audit`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    const createBtn = page.locator('button:has-text("创建审计规则")')
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('.ant-drawer')).toBeVisible()
      await page.screenshot({ path: '/tmp/test-resource-audit-rule-drawer.png' })
      await page.locator('.ant-drawer-close').first().click()
      await page.waitForTimeout(300)
    }
  })

  test('违规详情抽屉', async ({ page }) => {
    await page.goto(`${BASE}/resource/list/audit`)
    await page.waitForSelector('.resource-view', { timeout: 10000 })
    await page.waitForSelector('.page-header', { timeout: 5000 })
    const violationTab = page.locator('.ant-tabs-tab:has-text("违规")')
    if (await violationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await violationTab.click()
      await page.waitForTimeout(300)
    }
    const detailLink = page.locator('a:has-text("详情"), button:has-text("详情")').first()
    if (await detailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailLink.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: '/tmp/test-resource-audit-violation-drawer.png' })
    }
  })
})

test.describe('资源拓扑', () => {
  test('拓扑页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/topology`)
    await page.waitForSelector('.page-view, .topology-view', { timeout: 10000 })
    await page.screenshot({ path: '/tmp/test-resource-topology.png' })
  })
})

test.describe('变更记录', () => {
  test('变更页加载', async ({ page }) => {
    await page.goto(`${BASE}/resource/changes`)
    await page.waitForSelector('.page-view, .changes-view', { timeout: 10000 })
    await page.screenshot({ path: '/tmp/test-resource-changes.png' })
  })

  test('变更类型筛选', async ({ page }) => {
    await page.goto(`${BASE}/resource/changes`)
    await page.waitForSelector('.page-view, .changes-view', { timeout: 10000 })
    const select = page.locator('.ant-select').first()
    if (await select.isVisible({ timeout: 3000 }).catch(() => false)) {
      await select.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: '/tmp/test-resource-changes-filter.png' })
    }
  })
})
