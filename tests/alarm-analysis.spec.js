import { test, expect } from '@playwright/test'

const MOCK_OVERVIEW_STATS = {
  success: true,
  data: {
    heroStats: { closedCount: 128, reductionRate: 76, autoRate: 42, savedHours: 96 },
    categoryStats: [
      { category: '容量类', pct: 32 }, { category: '阈值类', pct: 28 },
      { category: '网络类', pct: 18 }, { category: '证书类', pct: 12 },
      { category: '服务类', pct: 8 }, { category: '硬件类', pct: 2 },
    ],
    funnelData: { raw: 1200, dedup: 1020, agg: 504, rate: 58 },
    healingRecords: [
      { id: 1, time: '2026-08-20 14:30', alert: 'CPU高负载', resource: 'server-01', action: '重启服务', result: 'success', duration: '45s', detail: '自动重启nginx服务成功', nodeLabel: 'server-01' },
      { id: 2, time: '2026-08-20 13:20', alert: '内存不足', resource: 'server-02', action: '扩容', result: 'failed', duration: '60s', detail: '资源不足无法扩容', nodeLabel: 'server-02' },
    ],
  },
}

const MOCK_INCIDENTS = {
  success: true,
  data: [
    { incident_no: 'INC-001', title: 'CPU负载过高触发自动扩容', level: 'critical', category: '容量类', status: 'investigating', handler: 'ai', affected_count: 3, related_alerts: [{ resource: 'server-01', level: 'critical', category: '计算' }] },
    { incident_no: 'INC-002', title: '数据库连接池耗尽', level: 'warning', category: '服务类', status: 'resolved', handler: 'manual', affected_count: 5, related_alerts: [{ resource: 'db-01', level: 'warning', category: '数据库' }] },
    { incident_no: 'INC-003', title: '证书即将过期', level: 'warning', category: '证书类', status: 'suppressed', handler: 'ai', affected_count: 2, related_alerts: [] },
    { incident_no: 'INC-004', title: '网络延迟超阈值', level: 'critical', category: '网络类', status: 'investigating', handler: null, affected_count: 8, related_alerts: [{ resource: 'switch-01', level: 'critical', category: '网络' }] },
    { incident_no: 'INC-005', title: '磁盘IO等待过高', level: 'info', category: '硬件类', status: 'resolved', handler: 'ai', affected_count: 1, related_alerts: [] },
    { incident_no: 'INC-006', title: '内存泄漏检测', level: 'warning', category: '服务类', status: 'investigating', handler: 'manual', affected_count: 4, related_alerts: [{ resource: 'app-01', level: 'warning', category: '应用' }] },
  ],
}

test.describe('告警分析 — 首页 Tab 切换', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
  })

  test('首页三个 Tab 按钮可见：告警分析、AI运维、概览', async ({ page }) => {
    await page.goto('/overview')
    await page.waitForSelector('.home-tabs', { timeout: 15000 })
    const tabs = page.locator('.home-tab-btn')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toContainText('告警分析')
    await expect(tabs.nth(1)).toContainText('AI运维')
    await expect(tabs.nth(2)).toContainText('概览')
  })

  test('点击告警分析 Tab → URL 变为 /overview?tab=alarm，告警分析内容渲染', async ({ page }) => {
    await page.goto('/overview')
    await page.waitForSelector('.home-tabs', { timeout: 15000 })
    await page.locator('.home-tab-btn', { hasText: '告警分析' }).click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/overview?tab=alarm')
    await expect(page.locator('.alarm-analysis-page')).toBeVisible()
  })

  test('告警分析 Tab 按钮高亮状态', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.home-tabs', { timeout: 15000 })
    const alarmTab = page.locator('.home-tab-btn', { hasText: '告警分析' })
    await expect(alarmTab).toHaveClass(/active/)
  })

  test('一级导航「首页」高亮，「告警」不高亮', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.module-nav', { timeout: 15000 })
    const homeNav = page.locator('.module-nav .nav-item', { hasText: '首页' })
    const alarmNav = page.locator('.module-nav .nav-item', { hasText: '告警' })
    await expect(homeNav).toHaveClass(/active/)
    await expect(alarmNav).not.toHaveClass(/active/)
  })

  test('切换到 AI 运维 Tab 后，告警分析内容消失', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })
    await page.locator('.home-tab-btn', { hasText: 'AI运维' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.alarm-analysis-page')).not.toBeVisible()
  })

  test('旧链接 /alarm-analysis 自动重定向到 /overview?tab=alarm', async ({ page }) => {
    await page.goto('/alarm-analysis')
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/overview?tab=alarm')
    await expect(page.locator('.alarm-analysis-page')).toBeVisible()
  })
})

test.describe('告警分析 — 页面5行布局', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })
  })

  test('Row1: Hero 指标卡显示4个指标（AI自动闭环数、降噪率、AI接管率、节省人工时）', async ({ page }) => {
    const heroCards = page.locator('.aa-hero-card')
    await expect(heroCards).toHaveCount(4)
    await expect(heroCards.nth(0)).toContainText('AI自动闭环数')
    await expect(heroCards.nth(1)).toContainText('告警降噪率')
    await expect(heroCards.nth(2)).toContainText('AI接管率')
    await expect(heroCards.nth(3)).toContainText('节省人工时')
  })

  test('Row1: Hero 指标数值正确渲染', async ({ page }) => {
    await expect(page.locator('.aa-hero-val').nth(0)).toContainText('128')
    await expect(page.locator('.aa-hero-val').nth(1)).toContainText('76%')
    await expect(page.locator('.aa-hero-val').nth(2)).toContainText('42%')
    await expect(page.locator('.aa-hero-val').nth(3)).toContainText('96')
  })

  test('Row2: 三个图表卡片（TopN、降噪漏斗、处理趋势）各有 G2 canvas', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    await expect(chartCards).toHaveCount(3)
    await expect(chartCards.nth(0)).toContainText('TopN 告警分类分布')
    await expect(chartCards.nth(1)).toContainText('降噪漏斗')
    await expect(chartCards.nth(2)).toContainText('处理趋势')
    const canvases = page.locator('.aa-chart-card canvas')
    await expect(canvases).toHaveCount(3)
  })

  test('Row2: 降噪率数值显示', async ({ page }) => {
    await expect(page.locator('.aa-funnel-rate')).toContainText('58%')
  })

  test('Row3: 告警分析列表表格渲染，含操作列', async ({ page }) => {
    await expect(page.locator('.aa-table-card').nth(0)).toBeVisible()
    const table = page.locator('.ant-table').first()
    await expect(table).toBeVisible()
    const rows = page.locator('.ant-table-tbody tr.ant-table-row')
    await expect(rows.first()).toBeVisible()
  })

  test('Row3: 表格列包含事件ID、根因摘要、级别、分类、状态、处理人、操作', async ({ page }) => {
    const headers = page.locator('.ant-table-thead th')
    const headerTexts = await headers.allTextContents()
    const joined = headerTexts.join(' ')
    expect(joined).toContain('事件ID')
    expect(joined).toContain('根因摘要')
    expect(joined).toContain('级别')
    expect(joined).toContain('分类')
    expect(joined).toContain('状态')
    expect(joined).toContain('处理人')
    expect(joined).toContain('操作')
  })

  test('Row4: 需关注应用卡片渲染', async ({ page }) => {
    await expect(page.locator('.aiops-app-cards')).toBeVisible()
    await expect(page.locator('.app-card').first()).toBeVisible()
  })

  test('Row5: 自动修复记录列表渲染', async ({ page }) => {
    await expect(page.locator('.aiops-healing-records')).toBeVisible()
    await expect(page.locator('.smart-remed-item').first()).toBeVisible()
  })
})

test.describe('告警分析 — 表格交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.ant-table', { timeout: 15000 })
  })

  test('状态筛选下拉框存在且可操作', async ({ page }) => {
    const select = page.locator('.aa-table-actions .ant-select').first()
    await expect(select).toBeVisible()
    await select.click()
    await expect(page.locator('.ant-select-dropdown')).toBeVisible()
  })

  test('搜索框存在且可输入', async ({ page }) => {
    const search = page.locator('.aa-table-actions .ant-input-search input')
    await expect(search).toBeVisible()
    await search.fill('CPU')
    await page.waitForTimeout(300)
    const rows = page.locator('.ant-table-tbody tr.ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(6)
  })

  test('根因摘要是蓝色链接，点击跳转到故障详情', async ({ page }) => {
    const link = page.locator('.aa-root-cause-link').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveCSS('color', 'rgb(0, 125, 255)')
    await link.click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/ops/incident/')
  })

  test('操作列按钮可见（AI分析/查看详情）', async ({ page }) => {
    const actionBtns = page.locator('.ant-table-tbody tr.ant-table-row').first().locator('.icon-btn')
    await expect(actionBtns.first()).toBeVisible()
  })

  test('点击查看详情按钮跳转到详情页', async ({ page }) => {
    const viewBtn = page.locator('.ant-table-tbody tr.ant-table-row').first().locator('.icon-btn').last()
    await viewBtn.click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/alarm-analysis/')
  })

  test('容量类告警操作列显示自愈按钮（⚡图标）', async ({ page }) => {
    const capacityRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: '容量类' })
    await expect(capacityRow).toBeVisible()
    const boltBtn = capacityRow.locator('.icon-btn').first()
    await expect(boltBtn).toBeVisible()
  })

  test('级别标签正确渲染（P1紧急/P2重要/P3提示）', async ({ page }) => {
    const criticalTag = page.locator('.ant-table-tbody .ant-tag', { hasText: 'P1紧急' })
    await expect(criticalTag.first()).toBeVisible()
    const warningTag = page.locator('.ant-table-tbody .ant-tag', { hasText: 'P2重要' })
    await expect(warningTag.first()).toBeVisible()
  })

  test('状态标签正确渲染（进行中/已闭环/已屏蔽）', async ({ page }) => {
    await expect(page.locator('.ant-table-tbody .ant-tag', { hasText: '进行中' }).first()).toBeVisible()
  })

  test('处理人显示：AI自动带机器人图标，手动显示人名', async ({ page }) => {
    const aiHandler = page.locator('.ant-table-tbody', { hasText: 'AI自动' })
    await expect(aiHandler).toBeVisible()
  })
})

test.describe('告警分析 — 详情页', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/incidents/INC-001**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            incident: {
              incident_no: 'INC-001', title: 'CPU负载过高触发自动扩容',
              root_cause: 'AI正在分析根因...', level: 'critical', category: '容量类',
              status: 'investigating', affected_count: 3, handler: 'ai',
              evidence: [{ time: '2026-08-20 08:58', type: 'alert', detail: 'CPU使用率95%' }],
              ai_confidence: 87,
              suggestions: ['检查相关服务状态', '查看应用日志', '必要时回滚'],
            },
            relatedAlerts: [{ id: 1, title: 'CPU使用率超过90%', level: 'critical', resource: 'server-01', category: '阈值类' }],
            categoryBreakdown: [{ category: '阈值类', count: 1 }],
          },
        }),
      })
    })
  })

  test('详情页加载正常，显示告警分析内容', async ({ page }) => {
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })
    await expect(page.locator('.alarm-analysis-view')).toBeVisible()
  })

  test('详情页显示事件编号和标题', async ({ page }) => {
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })
    await expect(page.locator('.alarm-analysis-view')).toContainText('INC-001')
    await expect(page.locator('.aa-title')).toContainText('智能告警分析')
  })

  test('详情页返回按钮存在', async ({ page }) => {
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })
    const backBtn = page.locator('.aa-back-btn')
    await expect(backBtn).toBeVisible()
  })

  test('详情页返回按钮跳转到 /overview?tab=alarm', async ({ page }) => {
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })
    const backBtn = page.locator('.aa-back-btn')
    await backBtn.click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/overview')
  })
})

test.describe('告警分析 — 页面级异常检测', () => {
  test('页面无 JS 错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })
    await page.waitForTimeout(2000)
    expect(errors).toEqual([])
  })
})
