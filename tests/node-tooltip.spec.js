import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('拓扑节点自定义 tooltip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/monitor/topology', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.evaluate(() => {
      const items = document.querySelectorAll('.nav-item')
      for (const item of items) {
        if (item.textContent.includes('应用拓扑')) { item.click(); break }
      }
    })
    // 切到订单系统 tab，确保有 IP/告警数据的节点（如 prod-order-01）
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.topology-tabs .tab-btn')
      for (const t of tabs) { if (t.textContent.includes('订单系统')) { t.click(); break } }
    })
    await page.waitForTimeout(3000)
  })

  test('hover 节点显示 tooltip 含名称/IP/告警', async ({ page }) => {
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      if (!g) return null
      // 找有 IP 的节点：prod-order-01
      const nodes = g.getNodeData()
      const target = nodes.find(n => n.id === 'prod-order-01') || nodes[0]
      const [sx, sy] = g.getClientByCanvas([target.style.x, target.style.y])
      return { id: target.id, sx, sy }
    })
    expect(nodeInfo).not.toBeNull()

    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(400)

    const tip = await page.evaluate(() => {
      const el = document.querySelector('.node-tip')
      if (!el) return null
      return {
        visible: true,
        name: el.querySelector('.nt-name')?.textContent,
        rows: Array.from(el.querySelectorAll('.nt-row')).map(r => r.textContent),
        btn: el.querySelector('.nt-detail-btn')?.textContent,
      }
    })
    expect(tip).not.toBeNull()
    expect(tip.name).toContain('订单服务-01')
    // 应含 IP 行与关联告警行
    expect(tip.rows.some(r => r.includes('IP') && r.includes('10.0.2.10'))).toBeTruthy()
    expect(tip.rows.some(r => r.includes('关联告警') && r.includes('3'))).toBeTruthy()
    expect(tip.btn).toContain('查看详情')
  })

  test('点击「查看详情」打开节点详情侧滑', async ({ page }) => {
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      const nodes = g.getNodeData()
      const target = nodes.find(n => n.id === 'prod-order-01') || nodes[0]
      const [sx, sy] = g.getClientByCanvas([target.style.x, target.style.y])
      return { id: target.id, sx, sy }
    })
    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(300)

    // 点击「查看详情」按钮（toolip 内）
    await page.click('.nt-detail-btn')
    await page.waitForTimeout(500)

    const panelOpen = await page.evaluate(() => {
      const panel = document.querySelector('.node-detail-panel.open')
      return !!panel
    })
    expect(panelOpen).toBeTruthy()
  })

  test('无 IP 节点不显示 IP 行（如 cdn）', async ({ page }) => {
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      const nodes = g.getNodeData()
      const target = nodes.find(n => n.id === 'cdn')
      if (!target) return null
      const [sx, sy] = g.getClientByCanvas([target.style.x, target.style.y])
      return { id: target.id, sx, sy }
    })
    if (!nodeInfo) return // cdn 不在过滤集则跳过
    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(400)
    const hasIpRow = await page.evaluate(() => {
      const el = document.querySelector('.node-tip')
      if (!el) return false
      return Array.from(el.querySelectorAll('.nt-row')).some(r => r.textContent.includes('IP'))
    })
    expect(hasIpRow).toBeFalsy()
  })
})
