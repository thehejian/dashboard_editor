import { test, expect } from '@playwright/test'
import fs from 'fs'

// ─────────────────────────────────────────────────────────────
// 全站页面巡检：页面跳转 / 页面UI / 样式风格（结构性断言）
// 只报告不修复，报告输出到 test-results/site-audit-report.json
// ─────────────────────────────────────────────────────────────

const INCIDENT_ID = 'INC-2026-0720'
const DASH_SLUGS = ['host', 'vm', 'nas', 'container', 'dev', 'test', 'bigdata', 'aimodel', 'ai-agent']

const PAGES = [
  // 首页
  { path: '/', group: '首页' },
  { path: '/overview', group: '首页' },
  { path: '/aiops', group: '首页' },
  { path: `/alarm-analysis/${INCIDENT_ID}`, group: '首页' },
  // 告警
  { path: '/alarm/current', group: '告警' },
  { path: '/alarm/events', group: '告警' },
  { path: '/alarm/customize', group: '告警' },
  { path: '/alarm/settings/rules', group: '告警' },
  { path: '/alarm/settings/notification', group: '告警' },
  { path: '/alarm/settings/extension', group: '告警' },
  // 监控
  { path: '/monitor/dashboard', group: '监控' },
  { path: '/monitor/config', group: '监控' },
  { path: '/monitor/topology', group: '监控' },
  { path: '/monitor/resource/card', group: '监控' },
  { path: '/monitor/resource/list', group: '监控' },
  { path: '/monitor/resource/all', group: '监控' },
  { path: '/monitor/resource/honeycomb', group: '监控' },
  // 资源
  { path: '/resource/list/overview', group: '资源' },
  { path: '/resource/list/discovery', group: '资源' },
  { path: '/resource/list/manage', group: '资源' },
  { path: '/resource/list/audit', group: '资源' },
  { path: '/resource/topology', group: '资源' },
  { path: '/resource/changes', group: '资源' },
  // 运维-基础
  { path: '/ops/jobs', group: '运维' },
  { path: '/ops/inspect', group: '运维' },
  // 日志管理
  ...[
    'operation/query', 'operation/config', 'operation/cluster',
    'runtime/query', 'runtime/download',
    'config/tasks', 'config/tasks/create', 'config/forward',
    'config/templates', 'config/destinations', 'config/download-settings',
  ].map(p => ({ path: `/ops/logs/${p}`, group: '运维-日志' })),
  // 异常事件
  ...[
    'overview/view', 'list/all', 'list/unprocessed', 'list/emergency',
    'rules/manage', 'alerts/rules', 'trace/tasks', 'trace/result', 'analysis',
  ].map(p => ({ path: `/ops/events/${p}`, group: '运维-事件' })),
  // 账号管理
  ...[
    'os/list', 'os/policy', 'os/thirdparty',
    'db/list', 'db/policy',
    'op/list', 'op/policy',
    'middleware/list', 'middleware/policy',
    'device/list', 'device/policy',
    'apply/history', 'apply/new', 'apply/create',
    'config/backup', 'config/esight-bmc', 'config/snapshot',
    'safebox', 'safebox/detail',
  ].map(p => ({ path: `/ops/account/${p}`, group: '运维-账号' })),
  // 故障中心
  ...[
    'list', 'postmortems', 'config/templates', 'config/templates/create',
    'config/records', 'analysis/trend', 'analysis/rca',
  ].map(p => ({ path: `/ops/incidents/${p}`, group: '故障中心' })),
  { path: `/ops/incident/${INCIDENT_ID}`, group: '故障中心' },
  // 设置
  { path: '/ops/settings/todo', group: '设置' },
  { path: '/ops/settings/apply', group: '设置' },
  { path: '/ops/settings/profile', group: '设置' },
  // 安全
  ...[
    'users', 'user-groups', 'policies', 'roles', 'resource-groups',
    'app-integration', 'app-integration/create', 'app-integration/detail',
    'idp', 'idp/create', 'integration-accounts',
  ].map(p => ({ path: `/system/security/${p}`, group: '系统-安全' })),
  { path: '/system/config', group: '系统' },
  // OBS
  { path: '/obs/overview', group: 'OBS' },
  // Dashboard 大屏
  ...DASH_SLUGS.map(s => ({ path: `/dashboard/${s}`, group: '大屏', isDashboard: true })),
]

const REDIRECTS = [
  ['/', '/aiops'],
  ['/alarm-analysis', '/overview'],
  ['/alarm', '/alarm/current'],
  ['/alarm/realtime', '/alarm/current'],
  ['/alarm/history', '/alarm/current'],
  ['/alarm/config', '/alarm/settings/rules'],
  ['/monitor/resource', '/monitor/resource/card'],
  ['/resource/list', '/resource/list/overview'],
  ['/resource/portal', '/resource/list/overview'],
  ['/ops/logs', '/ops/logs/operation/query'],
  ['/ops/events', '/ops/events/overview/view'],
  ['/ops/account', '/ops/account/os/list'],
  ['/ops/incidents', '/ops/incidents/list'],
  ['/ops/settings', '/ops/settings/todo'],
  ['/system/security', '/system/security/users'],
  ['/system/users', '/system/security/users'],
]

// 控制台错误白名单（已知无害）
const ERROR_WHITELIST = [
  /replaceState/i,          // Vite basic auth 下 history.replaceState SecurityError，不影响渲染
  /Failed to load resource/i,
  /net::ERR_/i,             // 外部代理不可达等网络噪音
  /favicon/i,
]

function classifyErrors(rawErrors) {
  return rawErrors.filter(e => !ERROR_WHITELIST.some(re => re.test(e)))
}

async function ensureBackend(page) {
  const res = await page.request.get('http://localhost:3001/api/mock/topology', { timeout: 5000 }).catch(() => null)
  if (!res || !res.ok()) throw new Error('后端服务 localhost:3001 不可达——请先执行 bash start.sh（或 nohup node server/server.js）再运行测试')
}

async function auditPage(page, path) {
  const result = { path, issues: [], jsErrors: [] }
  const raw = []
  const onConsole = m => { if (m.type() === 'error') raw.push(m.text()) }
  const onPageError = e => raw.push('未捕获异常: ' + e.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  try {
    await page.goto(path, { waitUntil: 'load', timeout: 20000 })
    await page.waitForTimeout(1200)

    // 1. #app 存在
    if (!await page.locator('#app').count()) result.issues.push('#app 不存在')

    // 2. 页面非空白（正文文本量）
    const textLen = await page.evaluate(() => document.body.innerText.trim().length)
    if (textLen < 30) result.issues.push(`页面疑似空白（正文仅 ${textLen} 字符）`)

    // 3. 顶部导航存在且高度 48px
    const header = page.locator('.header').first()
    if (!await header.count()) {
      result.issues.push('顶部导航 .header 不存在')
    } else {
      const h = await header.evaluate(el => el.getBoundingClientRect().height)
      if (Math.abs(h - 48) > 1) result.issues.push(`顶部导航高度 ${h}px ≠ 48px`)
    }

    // 4. #app padding-top 48px（大屏模式除外）
    const pt = await page.evaluate(() => getComputedStyle(document.querySelector('#app')).paddingTop)
    if (pt !== '48px') result.issues.push(`#app padding-top ${pt} ≠ 48px`)

    // 5. 品牌变量生效
    const brand = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim())
    if (brand.toUpperCase() !== '#007DFF') result.issues.push(`--brand = ${brand || '(空)'} ≠ #007DFF`)

    // 6. 内容区有可识别的渲染物（表格/图表/卡片/表单/自定义内容容器任一）
    const hasContent = await page.evaluate(() => !!(
      document.querySelector('table, .ant-table') ||
      document.querySelector('canvas') ||
      document.querySelector('svg') ||
      document.querySelector('.chart-card, .region-cards, .card-grid, .ant-card') ||
      document.querySelector('.ant-form, .ant-tabs, .ant-transfer, .ant-steps') ||
      document.querySelector('.alert-cards, .monitor-body, .job-list, .inspect-stats, .setting-section, .config-card')
    ))
    if (!hasContent) result.issues.push('未检测到表格/图表/卡片等内容元素')

    // 7. 列表页模板结构：有 .page-header 必须含 h3 标题；含表格的页面需有筛选能力
    //    （.filter-bar 为标准类名；.filter-admin/.il-filter-bar 及内联 ant-select 均视为功能等价）
    const ph = await page.evaluate(() => {
      const el = document.querySelector('.page-header')
      const hasTable = !!(document.querySelector('table, .ant-table'))
      const hasFilterRow = !!document.querySelector('.filter-bar, .filter-admin, .il-filter-bar')
      const hasFilterControl = !!document.querySelector('.ant-select, .ant-picker, input[type="text"], .ant-input')
      return el ? { hasH3: !!el.querySelector('h3'), hasTable, filterOk: hasFilterRow || hasFilterControl } : null
    })
    if (ph) {
      if (!ph.hasH3) result.issues.push('.page-header 缺少 h3 标题（列表页模板规范）')
      if (ph.hasTable && !ph.filterOk) result.issues.push('列表页缺少筛选行/筛选控件（列表页模板规范）')
    }

    // 7b. 控件高度 32px（AGENTS.md：不加 size="small"）；affix 输入框量外层 wrapper 而非内层裸 input
    const ctrlH = await page.evaluate(() => {
      const el = document.querySelector('.filter-bar .ant-select-selector, .filter-bar .ant-picker, .filter-bar .ant-input-affix-wrapper, .filter-bar .ant-input')
      return el ? Math.round(el.getBoundingClientRect().height) : null
    })
    if (ctrlH !== null && Math.abs(ctrlH - 32) > 4) result.issues.push(`筛选控件高度 ${ctrlH}px 偏离规范 32px`)

    // 7c. 搜索框置于筛选行末位且贴右（仅在存在真实搜索框时检查；贴右按内容盒算，剔除 bar 自身 padding）
    const searchInfo = await page.evaluate(() => {
      const bar = document.querySelector('.filter-bar')
      if (!bar) return null
      const rawSearch = bar.querySelector('.ant-input-search, input[placeholder*="搜索"]')
      if (!rawSearch) return null
      const host = rawSearch.closest('.ant-input-group-wrapper') || rawSearch.closest('.ant-input-affix-wrapper') || rawSearch
      const kids = [...bar.children]
      const cs = getComputedStyle(bar)
      const contentRight = bar.getBoundingClientRect().right - parseFloat(cs.paddingRight || '0')
      return { isLast: kids.indexOf(host) === kids.length - 1, gap: Math.round(contentRight - host.getBoundingClientRect().right) }
    })
    if (searchInfo && (!searchInfo.isLast || searchInfo.gap > 6)) {
      result.issues.push(`搜索框应位于筛选行末位并贴右（当前${searchInfo.isLast ? '' : '不在末位，'}右缘空隙 ${searchInfo.gap}px）`)
    }

    // 8. JS 错误分类
    result.jsErrors = classifyErrors(raw)
    if (result.jsErrors.length) result.issues.push(`JS 错误 ×${result.jsErrors.length}: ${result.jsErrors[0].slice(0, 160)}`)
  } catch (e) {
    result.issues.push(`页面加载失败: ${String(e.message).slice(0, 200)}`)
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }
  return result
}

function writeReport(kind, data) {
  const dir = 'test-results'
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(`${dir}/site-audit-report-${kind}.json`, JSON.stringify(data, null, 2))
}

function summarize(label, results) {
  const bad = results.filter(r => r.issues.length)
  console.log(`\n===== ${label}：${results.length} 页，问题页 ${bad.length} =====`)
  for (const r of bad) {
    console.log(`✗ ${r.path}`)
    r.issues.forEach(i => console.log(`    - ${i}`))
  }
  if (!bad.length) console.log('全部通过')
  return bad
}

test.describe('全站页面巡检', () => {

  test('A. 页面渲染巡检（全部页面 × UI结构×样式规范×JS错误）', async ({ page }) => {
    test.setTimeout(600000)
    await ensureBackend(page)
    const results = []
    for (const p of PAGES) {
      results.push(await auditPage(page, p.path))
    }
    const bad = summarize('页面渲染巡检', results)
    writeReport('render', { time: new Date().toISOString(), total: results.length, failed: bad.length, results })
    expect(bad.map(r => `${r.path}: ${r.issues.join(' | ')}`)).toEqual([])
  })

  test('B. 顶部导航跳转（6 大模块点击可达 + URL + 高亮校验）', async ({ page }) => {
    test.setTimeout(180000)
    await ensureBackend(page)
    await page.goto('/', { waitUntil: 'load' })
    const nav = page.locator('.module-nav')
    await expect(nav).toBeVisible()

    const jumps = []
    // 校验一次跳转：URL 前缀 + 顶部导航 active 高亮
    async function verifyJump(clickDesc, expectedPath, activeLabel) {
      await page.waitForTimeout(800)
      const u = new URL(page.url())
      const okUrl = (u.pathname + u.search).startsWith(expectedPath)
      let okActive = false
      let activeText = ''
      try {
        activeText = (await page.locator('.module-nav .nav-item.active').first().innerText({ timeout: 3000 })).trim()
        okActive = activeText.includes(activeLabel)
      } catch { /* 无高亮项 */ }
      jumps.push({ click: clickDesc, expected: expectedPath, actual: u.pathname + u.search, activeText, ok: okUrl && okActive })
    }
    // 直链模块
    for (const [label, expected] of [['首页', '/aiops'], ['告警', '/alarm/current'], ['资源', '/resource/list/overview']]) {
      await nav.locator('.nav-item', { hasText: label }).first().click()
      await verifyJump(label, expected, label)
    }
    // 下拉模块（菜单 key 即目标路由）
    const dropdownJumps = [
      ['监控', [['仪表盘', '/monitor/dashboard'], ['资源监控', '/monitor/resource'], ['监控配置', '/monitor/config'], ['拓扑视图', '/monitor/topology']]],
      ['运维', [['自动作业', '/ops/jobs'], ['日志管理', '/ops/logs'], ['异常事件', '/ops/events'], ['账号管理', '/ops/account'], ['故障中心', '/ops/incidents'], ['巡检报告', '/ops/inspect']]],
      ['系统', [['安全管理', '/system/security'], ['系统配置', '/system/config']]],
    ]
    for (const [parent, items] of dropdownJumps) {
      for (const [item, expected] of items) {
        await nav.locator('.nav-item', { hasText: parent }).first().click()
        await page.waitForTimeout(400)
        await page.locator('.ant-dropdown-menu-item', { hasText: item }).first().click()
        await verifyJump(`${parent}▸${item}`, expected, parent)
      }
    }

    // 每次跳转后页面都应正常渲染出导航栏
    const bad = jumps.filter(j => !j.ok)
    console.log(`\n===== 导航跳转：${jumps.length} 次，失败 ${bad.length} =====`)
    bad.forEach(j => console.log(`✗ 点击「${j.click}」期望 ${j.expected}，实际 ${j.actual}，高亮「${j.activeText}」`))
    writeReport('nav-jumps', { time: new Date().toISOString(), total: jumps.length, failed: bad.length, jumps })
    expect(bad.map(j => `${j.click}: 期望 ${j.expected} 实际 ${j.actual}`)).toEqual([])
    // 最后一个下拉项点击后页面仍应有内容
    await expect(page.locator('.header')).toBeVisible()
  })

  test('C. 路由重定向链', async ({ page }) => {
    test.setTimeout(240000)
    const results = []
    for (const [from, to] of REDIRECTS) {
      try {
        await page.goto(from, { waitUntil: 'load', timeout: 20000 })
        await page.waitForTimeout(600)
        const u = new URL(page.url())
        const ok = u.pathname === to || (u.pathname + u.search).startsWith(to)
        results.push({ from, to, actual: u.pathname + u.search, ok, issues: ok ? [] : [`期望重定向到 ${to}，实际停在 ${u.pathname}${u.search}`] })
      } catch (e) {
        results.push({ from, to, actual: '', ok: false, issues: [`加载失败: ${String(e.message).slice(0, 120)}`] })
      }
    }
    const bad = summarize('重定向链', results)
    writeReport('redirects', { time: new Date().toISOString(), total: results.length, failed: bad.length, results })
    expect(bad.map(r => `${r.from}: ${r.issues.join(' | ')}`)).toEqual([])
  })

  test('D. Dashboard 大屏页专项巡检', async ({ page }) => {
    test.setTimeout(300000)
    const results = []
    for (const slug of DASH_SLUGS) {
      const path = `/dashboard/${slug}`
      const result = { path, issues: [], jsErrors: [] }
      const raw = []
      const onConsole = m => { if (m.type() === 'error') raw.push(m.text()) }
      const onPageError = e => raw.push('未捕获异常: ' + e.message)
      page.on('console', onConsole)
      page.on('pageerror', onPageError)
      try {
        await page.goto(path, { waitUntil: 'load', timeout: 20000 })
        await page.waitForTimeout(2000) // 图表渲染留足时间
        // 大屏工具栏（dashboard-tab 或 mobile select）应存在
        const hasToolbar = await page.locator('.dashboard-toolbar').count()
        if (!hasToolbar) result.issues.push('缺少 .dashboard-toolbar 工具栏')
        // 当前 tab 高亮
        const activeTab = page.locator('.dashboard-tab.active', { hasText: /.+/ })
        if (await activeTab.count() === 0) result.issues.push('没有高亮的 .dashboard-tab.active')
        // 内容渲染物
        const charts = await page.locator('.chart-card, canvas, svg').count()
        if (charts === 0) result.issues.push('无任何图表渲染物（canvas/svg/chart-card）')
        result.jsErrors = classifyErrors(raw)
        if (result.jsErrors.length) result.issues.push(`JS 错误 ×${result.jsErrors.length}: ${result.jsErrors[0].slice(0, 160)}`)
      } catch (e) {
        result.issues.push(`加载失败: ${String(e.message).slice(0, 200)}`)
      } finally {
        page.off('console', onConsole)
        page.off('pageerror', onPageError)
      }
      results.push(result)
    }
    const bad = summarize('大屏巡检', results)
    writeReport('dashboards', { time: new Date().toISOString(), total: results.length, failed: bad.length, results })
    expect(bad.map(r => `${r.path}: ${r.issues.join(' | ')}`)).toEqual([])
  })

  test('E. 左侧树菜单跳转（嵌套路由抽查）', async ({ page }) => {
    test.setTimeout(180000)
    await ensureBackend(page)
    const results = []
    // [入口页, 菜单标题(唯一文本), 期望路由]
    const spotChecks = [
      ['/alarm/current', '事件', '/alarm/events'],
      ['/alarm/current', '个性化', '/alarm/customize'],
      ['/alarm/current', '告警规则', '/alarm/settings/rules'],
      ['/ops/logs/operation/query', '日志下载', '/ops/logs/runtime/download'],
      ['/ops/logs/operation/query', '日志转发任务', '/ops/logs/config/forward'],
      ['/ops/logs/operation/query', '集群状态', '/ops/logs/operation/cluster'],
    ]
    for (const [entry, title, expected] of spotChecks) {
      const row = { click: `${entry} ▸ ${title}`, expected, issues: [] }
      try {
        await page.goto(entry, { waitUntil: 'load', timeout: 20000 })
        // 注意：antd Tree 有展开动画的隐藏幽灵节点(.ant-tree-treenode[visibility:hidden])，必须用 :visible 过滤
        await expect(page.locator('.ant-tree-treenode:visible').first()).toBeVisible({ timeout: 20000 })
        await page.locator('.ant-tree-treenode:visible .ant-tree-title', { hasText: title }).first().click()
        await page.waitForTimeout(800)
        const u = new URL(page.url())
        if (!(u.pathname + u.search).startsWith(expected)) {
          row.issues.push(`点击后停在 ${u.pathname}${u.search}，期望 ${expected}`)
        }
        // 目标页应渲染出 page-header 标题
        if (!await page.locator('.page-header h3').count()) row.issues.push('目标页缺少 .page-header h3')
      } catch (e) {
        row.issues.push(`操作失败: ${String(e.message).slice(0, 140)}`)
      }
      results.push(row)
    }
    const bad = results.filter(r => r.issues.length)
    console.log(`\n===== 左侧树菜单跳转：${results.length} 次，失败 ${bad.length} =====`)
    bad.forEach(r => console.log(`✗ ${r.click}: ${r.issues.join(' | ')}`))
    writeReport('left-tree-jumps', { time: new Date().toISOString(), total: results.length, failed: bad.length, results })
    expect(bad.map(r => `${r.click}: ${r.issues.join(' | ')}`)).toEqual([])
  })
})
