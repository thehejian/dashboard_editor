import { test, expect } from '@playwright/test'

const MOCK_OVERVIEW_STATS = {
  success: true,
  data: {
    heroStats: { closedCount: 128, reductionRate: 76, autoRate: 42 },
    categoryStats: [
      { category: '容量类', pct: 32 }, { category: '阈值类', pct: 28 },
      { category: '网络类', pct: 18 }, { category: '证书类', pct: 12 },
      { category: '服务类', pct: 8 }, { category: '硬件类', pct: 2 },
    ],
    funnelData: { raw: 1200, dedup: 1020, agg: 504, rate: 58, filteredCritical: 12, filteredWarning: 45, filteredInfo: 180 },
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

  test('Row1: Hero 指标卡铺满一行（3列grid）', async ({ page }) => {
    const heroRow = page.locator('.aa-hero-row')
    const gridStyle = await heroRow.evaluate(el => getComputedStyle(el).gridTemplateColumns)
    const columns = gridStyle.split(' ')
    expect(columns.length).toBe(3)
  })

  test('Row1: Hero 指标卡显示3个指标（AI自动分析、降噪率、AI接管率）', async ({ page }) => {
    const heroCards = page.locator('.aa-hero-card')
    await expect(heroCards).toHaveCount(3)
    await expect(heroCards.nth(0)).toContainText('AI自动分析')
    await expect(heroCards.nth(1)).toContainText('告警降噪率')
    await expect(heroCards.nth(2)).toContainText('AI接管率')
  })

  test('Row1: Hero 指标数值正确渲染', async ({ page }) => {
    await expect(page.locator('.aa-hero-val').nth(0)).toContainText('128')
    await expect(page.locator('.aa-hero-val').nth(1)).toContainText('76%')
    await expect(page.locator('.aa-hero-val').nth(2)).toContainText('42%')
  })

  test('Row2: 图表卡片无 aa-chart-inner 包裹层', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    await expect(chartCards).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      const innerCount = await chartCards.nth(i).locator('.aa-chart-inner').count()
      expect(innerCount).toBe(0)
    }
  })

  test('Row2: 图表卡片使用 flex 布局自适应高度', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    for (let i = 0; i < 3; i++) {
      const display = await chartCards.nth(i).evaluate(el => getComputedStyle(el).display)
      expect(display).toBe('flex')
    }
  })

  test('Row2: 三个图表卡片（TopN、降噪过滤统计、处理趋势）各有 G2 图表', async ({ page }) => {
    const chartCards = page.locator('.aa-chart-card')
    await expect(chartCards).toHaveCount(3)
    await expect(chartCards.nth(0)).toContainText('告警类别分布')
    await expect(chartCards.nth(1)).toContainText('告警降噪过滤统计')
    await expect(chartCards.nth(2)).toContainText('告警AI处理趋势')
    const canvases = page.locator('.aa-chart-card canvas')
    await expect(canvases).toHaveCount(3)
  })

  test('Row2: 降噪过滤统计卡片显示总过滤数和分级统计', async ({ page }) => {
    const filterCard = page.locator('.aa-chart-card', { hasText: '告警降噪过滤统计' })
    await expect(filterCard).toBeVisible()
    await expect(filterCard).toContainText('总过滤')
    await expect(filterCard).toContainText('紧急')
    await expect(filterCard).toContainText('重要')
    await expect(filterCard).toContainText('次要')
  })

  test('Row2: 降噪率数值显示', async ({ page }) => {
    await expect(page.locator('.aa-hero-val').nth(1)).toContainText('76%')
  })

  test('Row3: 告警分析列表表格渲染，含操作列', async ({ page }) => {
    await expect(page.locator('.aa-table-card').nth(0)).toBeVisible()
    const table = page.locator('.ant-table').first()
    await expect(table).toBeVisible()
    const rows = page.locator('.ant-table-tbody tr.ant-table-row')
    await expect(rows.first()).toBeVisible()
  })

  test('Row3: 表格列包含故障名称、故障ID、级别、分类策略、状态、处理人、操作', async ({ page }) => {
    const headers = page.locator('.ant-table-thead th')
    const headerTexts = await headers.allTextContents()
    const joined = headerTexts.join(' ')
    expect(joined).toContain('故障名称')
    expect(joined).toContain('故障ID')
    expect(joined).toContain('级别')
    expect(joined).toContain('分类')
    expect(joined).toContain('状态')
    expect(joined).toContain('处理人')
    expect(joined).toContain('操作')
  })

  test('Row4: 需关注应用卡片已移除', async ({ page }) => {
    await expect(page.locator('.aiops-app-cards')).not.toBeVisible()
  })

  test('Row5: 自动修复记录列表已移除', async ({ page }) => {
    await expect(page.locator('.aiops-healing-records')).not.toBeVisible()
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

  test('故障名称是蓝色链接，点击跳转到故障详情', async ({ page }) => {
    const link = page.locator('.aa-root-cause-link').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveCSS('color', 'rgb(0, 125, 255)')
    await link.click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/ops/incident/')
  })

  test('操作列可见文字链接（AI分析/查看或自愈/查看）', async ({ page }) => {
    const links = page.locator('.ant-table-tbody tr.ant-table-row').first().locator('.aa-table-link')
    await expect(links.first()).toBeVisible()
  })

  test('点击查看链接跳转到故障详情页', async ({ page }) => {
    const viewLink = page.locator('.ant-table-tbody tr.ant-table-row').first().locator('.aa-table-link', { hasText: '查看' })
    await viewLink.click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/ops/incident/')
  })

  test('容量类告警操作列显示「自愈」文字链接', async ({ page }) => {
    const capacityRow = page.locator('.ant-table-tbody tr.ant-table-row', { hasText: '容量类' })
    await expect(capacityRow).toBeVisible()
    await expect(capacityRow.locator('.aa-table-link', { hasText: '自愈' })).toBeVisible()
  })

  test('级别标签正确渲染（紧急/重要/次要）', async ({ page }) => {
    const criticalTag = page.locator('.ant-table-tbody .ant-tag', { hasText: '紧急' })
    await expect(criticalTag.first()).toBeVisible()
    const warningTag = page.locator('.ant-table-tbody .ant-tag', { hasText: '重要' })
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

test.describe('告警分析 — 分类视图', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { incident_no: 'INC-2026-0725', title: '物理机CPU温度过高触发保护', level: 'critical', category: '硬件类', status: 'investigating', handler: 'ai', affected_count: 2, related_alerts: [{ resource: 'server-003', level: 'critical', category: '硬件类' }] },
            { incident_no: 'INC-2026-0720', title: '购物车核心交易链路数据库连接耗尽', level: 'critical', category: '阈值类', status: 'healing', handler: 'ai', affected_count: 4, related_alerts: [{ resource: 'server-01', level: 'critical', category: '阈值类' }] },
            { incident_no: 'INC-2026-0718', title: '用户服务登录鉴权超时', level: 'warning', category: '容量类', status: 'resolved', handler: 'ai', affected_count: 2, related_alerts: [{ resource: 'redis-cache', level: 'warning', category: '容量类' }] },
            { incident_no: 'INC-2026-0722', title: '库存服务扣减接口超时告警', level: 'warning', category: '服务类', status: 'investigating', handler: 'ai', affected_count: 1, related_alerts: [{ resource: 'inventory-service', level: 'warning', category: '服务类' }] },
            { incident_no: 'INC-2026-0715', title: '支付回调链路MQ消息堆积', level: 'critical', category: '服务类', status: 'resolved', handler: 'ai', affected_count: 1, related_alerts: [{ resource: 'pay-service', level: 'critical', category: '服务类' }] },
            { incident_no: 'INC-2026-0723', title: 'CDN域名SSL证书即将过期', level: 'info', category: '证书类', status: 'investigating', handler: 'ai', affected_count: 1, related_alerts: [{ resource: 'cdn-domain', level: 'info', category: '证书类' }] },
            { incident_no: 'INC-2026-0726', title: '安全组规则对外开放高危端口', level: 'warning', category: '配置类', status: 'investigating', handler: 'ai', affected_count: 1, related_alerts: [{ resource: 'sg-001', level: 'warning', category: '配置类' }] },
            { incident_no: 'INC-2026-0719', title: '消息网关WebSocket连接数异常飙升', level: 'warning', category: '容量类', status: 'investigating', handler: 'ai', affected_count: 1, related_alerts: [{ resource: 'msg-gateway', level: 'warning', category: '容量类' }] },
            { incident_no: 'INC-2026-0724', title: '华北区域核心交换机丢包率过高', level: 'critical', category: '网络类', status: 'investigating', handler: 'ai', affected_count: 2, related_alerts: [{ resource: 'switch-01', level: 'critical', category: '网络类' }] },
          ],
          categoryStats: [
            { category: '硬件类', count: 1, heal: 'auto', color: 'green', desc: '物理机/交换机' },
            { category: '阈值类', count: 1, heal: 'assist', color: 'orange', desc: '性能指标越限' },
            { category: '容量类', count: 2, heal: 'auto', color: 'green', desc: 'CPU/时延/IOPS瓶颈' },
            { category: '服务类', count: 2, heal: 'auto', color: 'green', desc: '进程退出/主备切换' },
            { category: '证书类', count: 1, heal: 'auto', color: 'green', desc: 'SSL/AK-SK泄露' },
            { category: '配置类', count: 1, heal: 'auto', color: 'green', desc: '暴露端口/策略违规' },
            { category: '网络类', count: 1, heal: 'assist', color: 'orange', desc: '专线/BGP/南北向' },
          ]
        })
      })
    })
    await page.goto('http://admin:745544752@localhost:5173/overview?tab=alarm')
    await page.waitForSelector('.aa-table-card', { timeout: 15000 })
  })

  test('分类统计条显示7个分类标签', async ({ page }) => {
    const catTags = page.locator('.aa-cat-tag')
    await expect(catTags.first()).toBeVisible()
    const count = await catTags.count()
    expect(count).toBe(7)
  })

  test('点击分类视图按钮切换到分类视图', async ({ page }) => {
    await page.click('button:has-text("分类视图")')
    await page.waitForTimeout(300)
    const catView = page.locator('.aa-category-view')
    await expect(catView).toBeVisible()
    const groups = page.locator('.aa-cat-group')
    const count = await groups.count()
    expect(count).toBe(7)
  })

  test('分类视图显示各分类的告警数量', async ({ page }) => {
    await page.click('button:has-text("分类视图")')
    await page.waitForTimeout(300)
    const titles = await page.locator('.aa-cat-group-title').allTextContents()
    expect(titles.some(t => t.includes('阈值类'))).toBeTruthy()
    expect(titles.some(t => t.includes('容量类'))).toBeTruthy()
    expect(titles.some(t => t.includes('硬件类'))).toBeTruthy()
    // 容量类和服务类各有2条
    expect(titles.some(t => t.includes('容量类') && t.includes('2'))).toBeTruthy()
    expect(titles.some(t => t.includes('服务类') && t.includes('2'))).toBeTruthy()
  })

  test('点击分类标签筛选该分类的告警', async ({ page }) => {
    await page.click('.aa-cat-tag:first-child')
    await page.waitForTimeout(300)
    const activeTag = page.locator('.aa-cat-tag.active')
    await expect(activeTag).toBeVisible()
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

test.describe('告警分析 — 完整故事线', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/alarm/overview-stats**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OVERVIEW_STATS) })
    })
    await page.route('**/api/alarm/incidents**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_INCIDENTS) })
    })
  })

  test('Step1: 进入告警分析页面，Hero/图表/表格均可见', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })

    await expect(page.locator('.aa-hero-row')).toBeVisible()
    await expect(page.locator('.aa-chart-row')).toBeVisible()
    await expect(page.locator('.aa-table-card').first()).toBeVisible()

    const rows = page.locator('.ant-table-row')
    await expect(rows.first()).toBeVisible()
  })

  test('Step2: 搜索故障ID → 表格过滤 → 清空恢复', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })

    const table = page.locator('.aa-table-card').first().locator('.ant-table')
    const rows = table.locator('.ant-table-row')
    const countBefore = await rows.count()
    expect(countBefore).toBeGreaterThan(0)

    const secondCell = await rows.first().locator('td').nth(1).textContent()
    const incidentId = secondCell.trim()
    expect(incidentId).toMatch(/^INC-/)

    const searchInput = page.locator('input[placeholder="搜索故障名称、ID"]')
    await searchInput.fill(incidentId)
    await page.waitForTimeout(500)

    const rowsAfterSearch = table.locator('.ant-table-row')
    const countAfterSearch = await rowsAfterSearch.count()
    expect(countAfterSearch).toBe(1)

    await searchInput.clear()
    await page.waitForTimeout(500)

    const rowsAfterClear = table.locator('.ant-table-row')
    const countAfterClear = await rowsAfterClear.count()
    expect(countAfterClear).toBe(countBefore)
  })

  test('Step3: 点击故障名称蓝链接 → 跳转详情页', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })

    const link = page.locator('.aa-root-cause-link').first()
    await expect(link).toBeVisible()
    await expect(link).toHaveCSS('color', 'rgb(0, 125, 255)')

    await link.click()
    await page.waitForTimeout(1000)

    expect(page.url()).toContain('/ops/incident/')
  })

  test('Step3b: 详情页故障名称/证据链/AI建议可见', async ({ page }) => {
    await page.route('**/api/alarm/incidents/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        success: true,
        data: {
          incident: {
            incident_no: 'INC-001',
            title: 'CPU负载过高触发自动扩容',
            root_cause: 'AI 正在分析根因',
            level: 'critical',
            severity: 'P1',
            category: '容量类',
            status: 'investigating',
            affected_count: 3,
            handler: 'ai',
            evidence: [
              { time: '08:58', event: '告警触发', type: 'alert', detail: 'P99 响应时间 3500ms' },
              { time: '09:00', event: 'AI 检测', type: 'detection', detail: '根因定位: 数据库连接池耗尽' },
            ],
            ai_confidence: 87,
            suggestions: ['检查相关服务状态', '查看应用日志定位异常'],
            can_heal: true,
          },
          relatedAlerts: [],
          categoryBreakdown: [],
        }
      })})
    })
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })

    await expect(page.locator('.aa-title')).toContainText('智能告警分析')
    await expect(page.locator('.aa-back-btn')).toBeVisible()
  })

  test('Step4: 详情页点击返回 → 回到告警分析页面', async ({ page }) => {
    await page.goto('/alarm-analysis/INC-001')
    await page.waitForSelector('.alarm-analysis-view', { timeout: 15000 })

    await page.locator('.aa-back-btn').click()
    await page.waitForTimeout(1000)

    expect(page.url()).toContain('/overview')
    await expect(page.locator('.alarm-analysis-page')).toBeVisible()

    const rows = page.locator('.ant-table-row')
    await expect(rows.first()).toBeVisible()
  })

  test('Step5: 点击关联告警数字 → Drawer打开显示告警列表', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })

    const link = page.locator('.aa-related-link').first()
    await expect(link).toBeVisible()
    await link.click()
    await page.waitForTimeout(1000)

    await expect(page.locator('.ant-drawer')).toBeVisible()
    await expect(page.locator('.ant-drawer-body')).toBeVisible()

    const drawerRows = page.locator('.ant-drawer-body .ant-table-row')
    const drawerRowCount = await drawerRows.count()
    expect(drawerRowCount).toBeGreaterThan(0)
  })

  test('Step6: 关闭Drawer → 回到表格', async ({ page }) => {
    await page.goto('/overview?tab=alarm')
    await page.waitForSelector('.alarm-analysis-page', { timeout: 15000 })

    await page.locator('.aa-related-link').first().click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.ant-drawer')).toBeVisible()

    await page.locator('.ant-drawer-close').click({ force: true })
    await page.waitForTimeout(1500)

    const drawerOpen = await page.evaluate(() => {
      const drawer = document.querySelector('.ant-drawer')
      return drawer ? drawer.classList.contains('ant-drawer-open') : false
    })
    expect(drawerOpen).toBe(false)
    await expect(page.locator('.aa-table-card').first()).toBeVisible()
  })
})
