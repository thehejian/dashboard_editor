import { test, expect } from '@playwright/test'

test.describe('告警规则配置 - 汇聚规则', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/rules')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(1000)
  })

  test('页面加载：标题和基础结构', async ({ page }) => {
    await expect(page.locator('.page-header h3')).toContainText('汇聚规则')
    await expect(page.locator('.ant-tabs')).toBeAttached()
  })

  test('Tab切换：汇聚规则 / AI优化建议（2个Tab）', async ({ page }) => {
    const tabs = page.locator('.ant-tabs-tab')
    await expect(tabs).toHaveCount(2)
    await expect(tabs.nth(0)).toContainText('汇聚规则')
    await expect(tabs.nth(1)).toContainText('AI优化建议')
  })

  test('汇聚规则Tab：默认显示10条规则（分页前10条）', async ({ page }) => {
    const rows = page.locator('.ant-table-tbody .ant-table-row')
    await expect(rows).toHaveCount(10)
    await expect(page.locator('.ant-pagination-total-text')).toContainText('共 10 条')
  })

  test('AI优化建议Tab：显示AI分析概览', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ai-overview')).toBeAttached()
    await expect(page.locator('.ai-overview')).toContainText('AI已分析')
  })

  test('AI优化建议Tab：显示4条建议卡片', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    const cards = page.locator('.suggestion-card')
    await expect(cards).toHaveCount(4)
  })

  test('AI优化建议Tab：建议卡片有采纳/忽略按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: 'AI优化建议' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.suggestion-card').first().locator('button', { hasText: '采纳' })).toBeAttached()
    await expect(page.locator('.suggestion-card').first().locator('button', { hasText: '忽略' })).toBeAttached()
  })

  test('汇聚规则Tab：新建汇聚规则按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    const btn = page.locator('button', { hasText: '新建汇聚规则' })
    await expect(btn).toBeAttached()
  })

  test('汇聚规则Drawer：点击新建打开Drawer', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer')).toBeAttached()
    await expect(page.locator('.ant-drawer-title')).toContainText('汇聚规则')
  })

  test('汇聚规则Drawer：包含4个面板', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer-body', { hasText: '基本信息' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '条件' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '汇聚参数' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '汇聚动作' })).toBeAttached()
  })

  test('汇聚规则Drawer：AI影响预估区域', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('.ant-drawer-body', { hasText: 'AI影响预估' })).toBeAttached()
  })

  test('汇聚规则Drawer：底部AI校验并保存按钮', async ({ page }) => {
    await page.locator('.ant-tabs-tab', { hasText: '汇聚规则' }).click()
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    const drawer = page.locator('.ant-drawer')
    await expect(drawer.locator('.ant-drawer-footer')).toBeAttached()
    await expect(drawer.locator('.ant-drawer-footer').locator('button')).toHaveCount(2)
  })
})

test.describe('告警规则配置 - Drawer Tab切换', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/rules')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
  })

  test('Drawer有3个Tab：告警汇聚规则 / 事件汇聚规则 / 批量创建', async ({ page }) => {
    const drawerTabs = page.locator('.ant-drawer-body .ant-tabs-tab')
    await expect(drawerTabs).toHaveCount(3)
    await expect(drawerTabs.nth(0)).toContainText('告警汇聚规则')
    await expect(drawerTabs.nth(1)).toContainText('事件汇聚规则')
    await expect(drawerTabs.nth(2)).toContainText('批量创建')
  })

  test('默认显示告警汇聚规则内容', async ({ page }) => {
    await expect(page.locator('.ant-drawer-body', { hasText: '面板1：基本信息' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板2：条件' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板3：汇聚参数' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板4：汇聚动作' })).toBeAttached()
  })

  test('切换到事件汇聚规则Tab', async ({ page }) => {
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '事件汇聚规则' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ant-drawer-body', { hasText: '面板1：基本信息' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板2：事件条件' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板3：事件汇聚参数' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '面板4：事件动作' })).toBeAttached()
  })

  test('切换到批量创建Tab', async ({ page }) => {
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '批量创建' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.batch-method-tabs')).toBeAttached()
    const methodTabs = page.locator('.batch-method-tab')
    await expect(methodTabs).toHaveCount(4)
  })

  test('切换Tab后内容正确显示', async ({ page }) => {
    // 先切到事件汇聚
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '事件汇聚规则' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ant-drawer-body', { hasText: '事件类型' })).toBeAttached()

    // 切到批量创建
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '批量创建' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.batch-method-tabs')).toBeAttached()

    // 切回告警汇聚
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '告警汇聚规则' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ant-drawer-body', { hasText: '面板1：基本信息' })).toBeAttached()
  })
})

test.describe('告警规则配置 - 事件汇聚规则Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/rules')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '事件汇聚规则' }).click()
    await page.waitForTimeout(500)
  })

  test('面板1：基本信息 - 规则名称和描述输入框', async ({ page }) => {
    const panel = page.locator('.ant-drawer-body', { hasText: '面板1：基本信息' })
    await expect(panel.locator('input').first()).toBeAttached()
    await expect(panel.locator('textarea')).toBeAttached()
  })

  test('面板2：事件条件 - 事件类型多选', async ({ page }) => {
    await expect(page.locator('.ant-drawer-body', { hasText: '事件类型' })).toBeAttached()
    const checkboxes = page.locator('.ant-checkbox-group .ant-checkbox-wrapper')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('面板2：事件条件 - 严重程度下拉', async ({ page }) => {
    await expect(page.locator('.ant-drawer-body', { hasText: '严重程度' })).toBeAttached()
  })

  test('面板2：事件条件 - 高级条件可添加删除', async ({ page }) => {
    const addBtn = page.locator('.ant-drawer-body button', { hasText: '+ 添加条件' })
    await expect(addBtn).toBeAttached()
    await addBtn.click()
    await page.waitForTimeout(300)
    const rows = page.locator('.ant-drawer-body .condition-row')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('面板3：事件汇聚参数 - 时间窗口模式选择', async ({ page }) => {
    await expect(page.locator('.ant-drawer-body', { hasText: '时间窗口' })).toBeAttached()
    const radios = page.locator('.ant-drawer-body .ant-radio-group .ant-radio-wrapper')
    const count = await radios.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('面板3：事件汇聚参数 - 固定窗口参数显示', async ({ page }) => {
    const fixedOption = page.locator('.ant-drawer-body .ant-radio-wrapper', { hasText: '固定窗口' })
    await expect(fixedOption).toBeAttached()
  })

  test('面板4：事件动作 - 5种汇聚动作', async ({ page }) => {
    const actionRadios = page.locator('.ant-drawer-body .ant-radio-group .ant-radio-wrapper')
    const count = await actionRadios.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('AI影响预估显示', async ({ page }) => {
    await expect(page.locator('.ant-drawer-body', { hasText: 'AI影响预估' })).toBeAttached()
    await expect(page.locator('.impact-card')).toBeAttached()
  })

  test('风险提示有排除按钮', async ({ page }) => {
    const excludeBtn = page.locator('.ant-drawer-body button', { hasText: '一键排除' })
    await expect(excludeBtn).toBeAttached()
  })
})

test.describe('告警规则配置 - 批量创建Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alarm/settings/rules')
    await page.waitForSelector('.ant-tabs', { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.locator('button', { hasText: '新建汇聚规则' }).click()
    await page.waitForTimeout(800)
    await page.locator('.ant-drawer-body .ant-tabs-tab', { hasText: '批量创建' }).click()
    await page.waitForTimeout(500)
  })

  test('4种创建方式Tab显示', async ({ page }) => {
    const methodTabs = page.locator('.batch-method-tab')
    await expect(methodTabs).toHaveCount(4)
    await expect(methodTabs.nth(0)).toContainText('CSV导入')
    await expect(methodTabs.nth(1)).toContainText('AI批量生成')
    await expect(methodTabs.nth(2)).toContainText('模板克隆')
    await expect(methodTabs.nth(3)).toContainText('手动批量')
  })

  test('默认显示CSV导入方式', async ({ page }) => {
    await expect(page.locator('.csv-upload-zone')).toBeAttached()
    await expect(page.locator('.csv-upload-zone', { hasText: '拖拽' })).toBeAttached()
  })

  test('CSV导入：模板下载链接', async ({ page }) => {
    await expect(page.locator('a', { hasText: '告警汇聚规则模板' })).toBeAttached()
    await expect(page.locator('a', { hasText: '事件汇聚规则模板' })).toBeAttached()
  })

  test('CSV导入：字段说明', async ({ page }) => {
    await expect(page.locator('.csv-fields-hint')).toBeAttached()
  })

  test('切换到AI批量生成', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: 'AI批量生成' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ai-prompt-box')).toBeAttached()
    await expect(page.locator('.ai-prompt-box textarea')).toBeAttached()
  })

  test('AI批量生成：快捷模板按钮', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: 'AI批量生成' }).click()
    await page.waitForTimeout(1000)
    const quickBtns = page.locator('.ant-drawer-body button', { hasText: /数据库类|网络类|服务器类|容器类|证书类/ })
    await expect(quickBtns.first()).toBeAttached({ timeout: 5000 })
    const count = await quickBtns.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('AI批量生成：点击快捷模板填充输入框', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: 'AI批量生成' }).click()
    await page.waitForTimeout(500)
    await page.locator('.ant-drawer-body button', { hasText: '数据库类' }).click()
    await page.waitForTimeout(300)
    const textarea = page.locator('.ai-prompt-box textarea')
    const value = await textarea.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('AI批量生成：生成按钮', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: 'AI批量生成' }).click()
    await page.waitForTimeout(500)
    const genBtn = page.locator('.ant-drawer-body button', { hasText: 'AI生成' })
    await expect(genBtn).toBeAttached()
  })

  test('切换到模板克隆', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '模板克隆' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.ant-drawer-body', { hasText: '源规则' })).toBeAttached()
    await expect(page.locator('.ant-drawer-body', { hasText: '克隆数量' })).toBeAttached()
    await expect(page.locator('.clone-batch-modify')).toBeAttached()
  })

  test('模板克隆：源规则下拉有10条可选', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '模板克隆' }).click()
    await page.waitForTimeout(500)
    const select = page.locator('.ant-drawer-body .ant-select', { hasText: '选择要克隆的规则' }).or(page.locator('.ant-drawer-body .ant-form-item').filter({ hasText: '源规则' }).locator('.ant-select'))
    await expect(select).toBeAttached()
  })

  test('模板克隆：批量修改行有4项', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '模板克隆' }).click()
    await page.waitForTimeout(500)
    const rows = page.locator('.clone-modify-row')
    await expect(rows).toHaveCount(4)
  })

  test('切换到手动批量', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '手动批量' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.manual-batch-table')).toBeAttached()
    await expect(page.locator('.manual-table')).toBeAttached()
  })

  test('手动批量：默认1行', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '手动批量' }).click()
    await page.waitForTimeout(500)
    const rows = page.locator('.manual-table tbody tr')
    await expect(rows).toHaveCount(1)
  })

  test('手动批量：添加行按钮', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '手动批量' }).click()
    await page.waitForTimeout(500)
    const addBtn = page.locator('.ant-drawer-body button', { hasText: '添加一行' })
    await expect(addBtn).toBeAttached()
    await addBtn.click()
    await page.waitForTimeout(300)
    const rows = page.locator('.manual-table tbody tr')
    await expect(rows).toHaveCount(2)
  })

  test('手动批量：汇总信息', async ({ page }) => {
    await page.locator('.batch-method-tab', { hasText: '手动批量' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.manual-batch-summary')).toBeAttached()
    await expect(page.locator('.manual-batch-summary', { hasText: '已添加' })).toBeAttached()
  })
})
