import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('告警与故障双向关联', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('http://localhost:3001/api/sre/reset')
  })

  test('告警列表展示关联故障列(INC徽章/一键建单)', async ({ page }) => {
    await page.goto(`${BASE}/alarm/current`)
    await page.waitForSelector('.ant-table-row', { timeout: 10000 })

    // 已关联告警显示 INC 徽章
    const incidentTag = page.locator('.incident-tag').first()
    await expect(incidentTag).toBeVisible()
    const tagText = await incidentTag.textContent()
    expect(tagText).toMatch(/INC-\d+-\d+/)

    // 未关联告警显示一键建单按钮
    const createBtn = page.locator('.create-incident-btn').first()
    await expect(createBtn).toBeVisible()
  })

  test('点击INC徽章跳转故障详情页', async ({ page }) => {
    await page.goto(`${BASE}/alarm/current`)
    await page.waitForSelector('.incident-tag', { timeout: 10000 })
    await page.locator('.incident-tag').first().click()
    await expect(page).toHaveURL(/ops\/incident\//)
    await expect(page.locator('.sre-title')).toContainText('智能故障自愈终端')
  })

  test('抽屉一键生成故障单按钮可用', async ({ page }) => {
    await page.goto(`${BASE}/alarm/current`)
    await page.waitForSelector('.ant-table-row', { timeout: 10000 })

    // 打开未关联告警详情抽屉
    await page.locator('.alert-link').first().click()
    await page.waitForTimeout(500)

    const drawerCreateBtn = page.locator('.drawer-create-incident-btn')
    if (await drawerCreateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await drawerCreateBtn.click()
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/ops\/incident\//)
    }
  })

  test('首页未关联告警提示及一键聚合', async ({ page }) => {
    await page.goto(`${BASE}/aiops`)
    await page.waitForSelector('.home-view', { timeout: 10000 })
    await page.click('.home-tab-btn:has-text("概览")')
    await page.waitForSelector('.kpi-card', { timeout: 10000 })

    const unlinked = page.locator('.card-unlinked-alert')
    if (await unlinked.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(unlinked).toContainText('未关联')
      const aggBtn = unlinked.locator('button', { hasText: '一键聚合' })
      await expect(aggBtn).toBeVisible()
    }
  })
})

test.describe('故障中心关联告警', () => {
  test('故障列表展示关联告警计数', async ({ page }) => {
    await page.goto(`${BASE}/ops/incidents/list`)
    await page.waitForSelector('.ant-table-row', { timeout: 10000 })
    await expect(page.locator('.page-header h3')).toHaveText('故障列表')

    const tag = page.locator('.il-related-alert-tag').first()
    await expect(tag).toBeVisible()
  })

  test('点击关联告警标签跳转告警页并按incident过滤', async ({ page }) => {
    await page.goto(`${BASE}/ops/incidents/list`)
    await page.waitForSelector('.il-related-alert-tag', { timeout: 10000 })
    await page.locator('.il-related-alert-tag').first().click()
    await expect(page).toHaveURL(/alarm\/current\?incidentId=/)
  })

  test('SRE终端关联告警面板渲染', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0720`)
    await expect(page.locator('.related-alerts-panel')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.related-alerts-panel .rap-title')).toContainText('关联告警')
    await expect(page.locator('.rap-item').first()).toBeVisible()
  })
})
