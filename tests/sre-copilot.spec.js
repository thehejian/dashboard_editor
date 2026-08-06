import { test, expect } from '@playwright/test'

test.describe('AIOps 页面', () => {
  test('AI运维页面完整加载', async ({ page }) => {
    await page.goto('/aiops')

    // 输入框可见
    const textarea = page.locator('.aiops-intent-input')
    await expect(textarea).toBeVisible()

    // KPI 卡片加载
    await expect(page.locator('.aiops-kpi-card').first()).toBeVisible({ timeout: 10000 })

    // 应用热力图加载
    await expect(page.locator('.aiops-heatmap')).toBeVisible()

    // 智能诊断区域加载
    await expect(page.locator('.aiops-smart')).toBeVisible()
  })

  test('点击应用卡片打开抽屉，故障列表 tab 存在', async ({ page }) => {
    await page.goto('/aiops')

    // 等待应用卡片出现
    const appCard = page.locator('.app-card').first()
    await expect(appCard).toBeVisible({ timeout: 10000 })
    await appCard.click()

    // 抽屉打开
    await expect(page.locator('.app-drawer.open')).toBeVisible()

    // 故障列表 tab 存在
    const faultListTab = page.locator('.app-drawer-tab', { hasText: '故障列表' })
    await expect(faultListTab).toBeVisible()

    // 点击故障列表 tab
    await faultListTab.click()

    // 故障列表内容区域可见
    await expect(page.locator('.fault-list-tab')).toBeVisible()
  })
})

test.describe('SRE 故障自愈终端', () => {
  test.beforeEach(async ({ page }) => {
    // Reset shared mock data to avoid cross-worker mutation
    await page.request.post('http://localhost:3001/api/sre/reset')
  })

  test('故障详情页加载完整', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')

    // 标题加载
    await expect(page.locator('.sre-title')).toContainText('智能故障自愈终端')

    // Tab 栏加载
    await expect(page.locator('.sre-tab').first()).toBeVisible()

    // 故障摘要卡片加载
    await expect(page.locator('.fault-summary-card')).toBeVisible({ timeout: 10000 })

    // 拓扑图加载
    await expect(page.locator('.topology-panel')).toBeVisible()

    // 错误率趋势图加载
    await expect(page.locator('.error-rate-trend')).toBeVisible()

    // 自愈编排加载
    await expect(page.locator('.healing-playbook')).toBeVisible()

    // 底部复盘按钮加载
    await expect(page.locator('.sre-postmortem-btn')).toBeVisible()
  })

  test('切换到复盘沉淀 tab', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')

    // 等待页面加载
    await expect(page.locator('.fault-summary-card')).toBeVisible({ timeout: 10000 })

    // 点击复盘沉淀 tab
    const postmortemTab = page.locator('.sre-tab', { hasText: '复盘沉淀' })
    await postmortemTab.click()

    // 复盘报告加载
    await expect(page.locator('.postmortem-report')).toBeVisible()

    // 报告标题
    await expect(page.locator('.pmr-subtitle')).toContainText('复盘沉淀')

    // 复制按钮存在
    await expect(page.locator('button', { hasText: '复制 MD 文本' })).toBeVisible()

    // 返回按钮存在
    await expect(page.locator('button', { hasText: '返回故障终端' })).toBeVisible()
  })

  test('底部复盘按钮可点击', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')

    await expect(page.locator('.fault-summary-card')).toBeVisible({ timeout: 10000 })

    // 点击底部复盘按钮
    await page.locator('.sre-postmortem-btn').click()

    // 切换到复盘视图
    await expect(page.locator('.postmortem-report')).toBeVisible()
  })

  test('返回按钮存在', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')
    await expect(page.locator('.sre-back-btn')).toBeVisible({ timeout: 10000 })
  })

  test('AI自动执行按钮存在', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')
    await expect(page.locator('.hp-ai-btn', { hasText: 'AI自动执行' })).toBeVisible({ timeout: 10000 })
  })

  test('未完成步骤显示手动执行按钮', async ({ page }) => {
    await page.goto('/ops/incident/INC-2026-0720')
    await expect(page.locator('.healing-playbook')).toBeVisible({ timeout: 10000 })
    // Steps 2-4 should show execute buttons (custom .hp-run-btn)
    const runButtons = page.locator('.hp-step .hp-run-btn')
    await expect(runButtons.first()).toBeVisible()
  })
})
