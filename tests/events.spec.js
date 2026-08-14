import { test, expect } from '@playwright/test'

test.describe('异常事件管理', () => {
  test('导航菜单存在并点击跳转', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-dropdown').filter({ hasText: '运维' }).click()
    await page.getByText('异常事件', { exact: true }).click()
    await expect(page).toHaveURL(/\/ops\/events/)
  })

  test('侧边栏菜单结构完整', async ({ page }) => {
    await page.goto('/ops/events/overview/view')
    await expect(page.locator('.sidebar-title').first()).toContainText('异常事件管理')
    await expect(page.locator('.events-sidebar')).toContainText('概览')
    await expect(page.locator('.events-sidebar')).toContainText('事件列表')
    await expect(page.locator('.events-sidebar')).toContainText('日志追踪')
    await expect(page.locator('.events-sidebar')).toContainText('检测规则')
    await expect(page.locator('.events-sidebar')).toContainText('转告警规则')
  })

  test('事件概览页 - 统计卡片和图表', async ({ page }) => {
    await page.goto('/ops/events/overview/view')
    await expect(page.locator('.stat-cards')).toBeVisible()
    const cards = page.locator('.stat-card')
    await expect(cards).toHaveCount(5)
    await expect(cards.first()).toContainText('事件总数')
    await expect(cards.first()).toContainText('1,286')
    await expect(page.locator('.chart-grid')).toBeVisible()
    await expect(page.locator('.chart-card')).toHaveCount(5)
  })

  test('事件概览 - 趋势图时间切换', async ({ page }) => {
    await page.goto('/ops/events/overview/view')
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 24 小时' }).click()
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 30 天' }).click()
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 7 天' }).click()
  })

  test('事件列表 - 全部事件页', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await expect(page.locator('.breadcrumb')).toContainText('全部事件')
    await expect(page.locator('.filter-bar')).toBeVisible()
    await expect(page.locator('.ant-table')).toBeVisible()
    await expect(page.locator('.table-title')).toContainText('事件列表')
  })

  test('事件列表 - 筛选查询', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await page.locator('.filter-bar .ant-select').first().click()
    await page.locator('.ant-select-item-option').filter({ hasText: '运行日志' }).first().click()
    await page.getByRole('button', { name: '查 询' }).click()
    await page.getByRole('button', { name: '重 置' }).click()
  })

  test('事件列表 - 分页功能', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await expect(page.locator('.table-total')).toContainText('6')
  })

  test('事件列表 - 详情弹窗', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await page.locator('a').filter({ hasText: '详情' }).first().click()
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal')).toContainText('事件详情')
    await expect(page.locator('.ant-modal')).toContainText('基本信息')
    await expect(page.locator('.ant-modal')).toContainText('原始日志内容')
    await page.keyboard.press('Escape')
  })

  test('事件列表 - 追踪弹窗', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await page.locator('a').filter({ hasText: '追踪' }).first().click()
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal')).toContainText('创建追踪任务')
    await page.keyboard.press('Escape')
  })

  test('未处理事件页', async ({ page }) => {
    await page.goto('/ops/events/list/unprocessed')
    await expect(page.locator('.breadcrumb')).toContainText('未处理事件')
  })

  test('紧急事件页', async ({ page }) => {
    await page.goto('/ops/events/list/emergency')
    await expect(page.locator('.breadcrumb')).toContainText('紧急事件')
  })

  test('检测规则管理页', async ({ page }) => {
    await page.goto('/ops/events/rules/manage')
    await expect(page.locator('.breadcrumb')).toContainText('规则管理')
    await expect(page.locator('.ant-table')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建规则' })).toBeVisible()
  })

  test('规则详情弹窗', async ({ page }) => {
    await page.goto('/ops/events/rules/manage')
    await page.locator('a').filter({ hasText: '详情' }).first().click()
    await expect(page.locator('.ant-modal')).toContainText('规则详情')
    await page.keyboard.press('Escape')
  })

  test('新建规则弹窗', async ({ page }) => {
    await page.goto('/ops/events/rules/manage')
    await page.getByRole('button', { name: '新建规则' }).first().click()
    await expect(page.locator('.ant-modal')).toContainText('新建检测规则')
    await expect(page.locator('.ant-modal')).toContainText('检测条件')
    await page.keyboard.press('Escape')
  })

  test('告警转换规则页', async ({ page }) => {
    await page.goto('/ops/events/alerts/rules')
    await expect(page.locator('.breadcrumb')).toContainText('告警转换规则')
    await expect(page.locator('.ant-table')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建告警转换规则' })).toBeVisible()
  })

  test('新建告警转换规则弹窗', async ({ page }) => {
    await page.goto('/ops/events/alerts/rules')
    await page.getByRole('button', { name: '新建告警转换规则' }).click()
    await expect(page.locator('.ant-modal')).toContainText('新建告警转换规则')
    await page.keyboard.press('Escape')
  })

  test('告警详情弹窗', async ({ page }) => {
    await page.goto('/ops/events/alerts/rules')
    await page.locator('a').filter({ hasText: '详情' }).first().click()
    await expect(page.locator('.ant-modal')).toContainText('告警规则详情')
    await page.keyboard.press('Escape')
  })

  test('日志追踪任务管理页', async ({ page }) => {
    await page.goto('/ops/events/trace/tasks')
    await expect(page.locator('h3').first()).toContainText('日志追踪任务管理')
    await expect(page.locator('.ant-table')).toBeVisible()
    await expect(page.getByRole('button', { name: '创建实时追踪' })).toBeVisible()
    await expect(page.getByRole('button', { name: '创建事件追踪' })).toBeVisible()
  })

  test('创建追踪任务弹窗', async ({ page }) => {
    await page.goto('/ops/events/trace/tasks')
    await page.getByRole('button', { name: '创建事件追踪' }).click()
    await expect(page.locator('.ant-modal')).toContainText('创建事件追踪')
    await page.keyboard.press('Escape')
  })

  test('追踪结果页', async ({ page }) => {
    await page.goto('/ops/events/trace/result?taskId=TRC-001')
    await expect(page.locator('h3').first()).toContainText('追踪结果')
    await expect(page.locator('.task-info-card')).toBeVisible()
    await expect(page.locator('.log-content-area')).toBeVisible()
    await expect(page.locator('.log-list')).toBeVisible()
    await expect(page.locator('.event-line')).toBeVisible()
  })

  test('追踪结果 - 日志不存在状态', async ({ page }) => {
    await page.goto('/ops/events/trace/result?taskId=TRC-002')
    await expect(page.locator('.empty-state.error')).toBeVisible()
  })

  test('追踪结果 - 返回按钮', async ({ page }) => {
    await page.goto('/ops/events/trace/result?taskId=TRC-001')
    await page.locator('button').filter({ hasText: '← 返回' }).click()
    await expect(page).toHaveURL(/\/ops\/events\/trace\/tasks/)
  })

  test('事件关联分析页', async ({ page }) => {
    await page.goto('/ops/events/analysis')
    await expect(page.locator('h3').first()).toContainText('事件关联分析')
    await expect(page.locator('.event-info-bar')).toBeVisible()
    await expect(page.locator('.topology-desc')).toBeVisible()
    await expect(page.locator('.swimlane-container')).toBeVisible()
    await expect(page.locator('.legend-bar')).toBeVisible()
  })

  test('事件关联分析 - 泳道图行数', async ({ page }) => {
    await page.goto('/ops/events/analysis')
    const rows = page.locator('.swimlane-row')
    await expect(rows).toHaveCount(5)
    await expect(rows.first()).toContainText('下游')
    await expect(rows.nth(2)).toContainText('gaussdb-prod-01')
    await expect(rows.nth(2)).toContainText('当前对象')
    await expect(rows.nth(4)).toContainText('上游')
  })

  test('事件关联分析 - 时间范围切换', async ({ page }) => {
    await page.goto('/ops/events/analysis')
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 24 小时' }).click()
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 3 天' }).click()
    await page.locator('.ant-radio-button-wrapper').filter({ hasText: '近 6 小时' }).click()
  })

  test('事件关联分析 - 返回按钮', async ({ page }) => {
    await page.goto('/ops/events/analysis')
    await page.locator('button').filter({ hasText: '← 返回' }).click()
    await expect(page).toHaveURL(/\/ops\/events\/list\/all/)
  })

  test('侧边栏菜单点击切换页面', async ({ page }) => {
    await page.goto('/ops/events/overview/view')
    await page.locator('.events-sidebar').locator('text=全部事件').click()
    await expect(page).toHaveURL(/\/ops\/events\/list\/all/)
    await page.locator('.events-sidebar').locator('text=规则管理').click()
    await expect(page).toHaveURL(/\/ops\/events\/rules\/manage/)
    await page.locator('.events-sidebar').locator('text=告警转换规则').click()
    await expect(page).toHaveURL(/\/ops\/events\/alerts\/rules/)
    await page.locator('.events-sidebar').locator('text=追踪任务管理').click()
    await expect(page).toHaveURL(/\/ops\/events\/trace\/tasks/)
    await page.locator('.events-sidebar').locator('text=事件概览').click()
    await expect(page).toHaveURL(/\/ops\/events\/overview\/view/)
  })

  test('事件列表 - 批量标记已处理', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    const checkbox = page.locator('.ant-table-thead .ant-checkbox-input').first()
    await checkbox.check({ force: true })
    await page.getByRole('button', { name: '批量标记已处理' }).click()
  })

  test('事件列表 - 导出按钮', async ({ page }) => {
    await page.goto('/ops/events/list/all')
    await expect(page.getByRole('button', { name: '导 出' })).toBeVisible()
  })
})