import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('工单跟踪流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('http://localhost:3001/api/sre/reset')
  })

  test('后端返回工单跟踪数据', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/sre/incidents/INC-2026-0723/tracking')
    const json = await res.json()
    expect(json.success).toBeTruthy()
    expect(json.data.assignee).toBe('张工')
    expect(json.data.sla_status).toBe('warning')
    expect(json.data.checklist.length).toBeGreaterThan(0)
    expect(json.data.tracking_timeline.length).toBeGreaterThan(0)
    expect(json.data.tracking_comments.length).toBeGreaterThan(0)
  })

  test('后端返回全部11条incident的tracking数据', async ({ request }) => {
    const ids = [
      'INC-2026-0720', 'INC-2026-0718', 'INC-2026-0715', 'INC-2026-0722',
      'INC-2026-0721', 'INC-2026-0719', 'INC-2026-0717', 'INC-2026-0723',
      'INC-2026-0724', 'INC-2026-0725', 'INC-2026-0726',
    ]
    for (const id of ids) {
      const res = await request.get(`http://localhost:3001/api/sre/incidents/${id}/tracking`)
      const json = await res.json()
      expect(json.success).toBeTruthy()
      expect(json.data.assignee).toBeTruthy()
      expect(json.data.checklist.length).toBeGreaterThan(0)
    }
  })

  test('CATEGORY_STRATEGY降级后auto=2类assist=5类', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/alarm/incidents')
    const json = await res.json()
    const stats = json.categoryStats
    const autoCategories = stats.filter(s => s.heal === 'auto')
    const assistCategories = stats.filter(s => s.heal === 'assist')
    expect(autoCategories.length).toBe(2)
    expect(assistCategories.length).toBe(5)
    expect(autoCategories.map(s => s.category)).toEqual(expect.arrayContaining(['容量类', '服务类']))
  })

  test('故障详情页显示工单跟踪按钮', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-title', { timeout: 10000 })
    const trackingBtn = page.locator('.sre-tracking-btn')
    await expect(trackingBtn).toBeVisible()
    await expect(trackingBtn).toContainText('工单跟踪')
  })

  test('点击工单跟踪按钮打开Drawer', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-tracking-btn', { timeout: 10000 })
    await page.locator('.sre-tracking-btn').click()
    // Drawer should appear
    await page.waitForSelector('.ant-drawer-body', { timeout: 5000 })
    await expect(page.locator('.ant-drawer-body')).toBeVisible()
  })

  test('工单跟踪Drawer显示checklist/timeline/comments', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-tracking-btn', { timeout: 10000 })
    await page.locator('.sre-tracking-btn').click()
    await page.waitForSelector('.td-body', { timeout: 5000 })

    // Checklist visible
    const steps = page.locator('.td-step')
    await expect(steps.first()).toBeVisible()
    const stepCount = await steps.count()
    expect(stepCount).toBeGreaterThan(0)

    // Timeline visible
    const tlItems = page.locator('.td-tl-item')
    await expect(tlItems.first()).toBeVisible()
    expect(await tlItems.count()).toBeGreaterThan(0)

    // Comments visible
    const comments = page.locator('.td-comment')
    await expect(comments.first()).toBeVisible()
    expect(await comments.count()).toBeGreaterThan(0)
  })

  test('Drawer显示assignee和SLA状态', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-tracking-btn', { timeout: 10000 })
    await page.locator('.sre-tracking-btn').click()
    await page.waitForSelector('.td-body', { timeout: 5000 })

    // Assignee badge visible
    await expect(page.locator('.td-assignee')).toContainText('张工')
    // SLA badge visible with warning status
    const slaBadge = page.locator('.td-sla-badge')
    await expect(slaBadge).toBeVisible()
    await expect(slaBadge).toHaveClass(/sla-warning/)
  })

  test('Drawer可正常关闭', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-tracking-btn', { timeout: 10000 })
    await page.locator('.sre-tracking-btn').click()
    await page.waitForSelector('.td-body', { timeout: 5000 })
    // Close drawer
    await page.locator('.ant-drawer-close').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.td-body')).not.toBeVisible()
  })

  test('checklist步骤状态图标正确', async ({ page }) => {
    await page.goto(`${BASE}/ops/incident/INC-2026-0723`)
    await page.waitForSelector('.sre-tracking-btn', { timeout: 10000 })
    await page.locator('.sre-tracking-btn').click()
    await page.waitForSelector('.td-step', { timeout: 5000 })

    // Done steps have check-circle icon
    const doneSteps = page.locator('.td-step.step-done')
    expect(await doneSteps.count()).toBeGreaterThanOrEqual(3)

    // Running step has spinner icon
    const runningStep = page.locator('.td-step.step-running')
    expect(await runningStep.count()).toBe(1)

    // Pending steps exist
    const pendingSteps = page.locator('.td-step.step-pending')
    expect(await pendingSteps.count()).toBeGreaterThan(0)
  })
})
