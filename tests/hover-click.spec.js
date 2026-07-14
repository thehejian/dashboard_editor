import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('应用拓扑节点悬停与点击效果', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/monitor/topology', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(2000)
    // Click "应用拓扑" in sidebar
    await page.evaluate(() => {
      const items = document.querySelectorAll('.nav-item')
      for (const item of items) {
        if (item.textContent.includes('应用拓扑')) { item.click(); break }
      }
    })
    await page.waitForTimeout(3000)
  })

  test('悬停节点显示 hover 状态，移开后消失', async ({ page }) => {
    // Get first node screen coords
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      if (!g) return null
      const nodes = g.getNodeData()
      if (!nodes.length) return null
      const node = nodes[0]
      const [sx, sy] = g.getClientByCanvas([node.style.x, node.style.y])
      return { id: node.id, sx, sy }
    })
    expect(nodeInfo).not.toBeNull()

    // Hover over node
    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(500)

    const hoverState = await page.evaluate(id => window.__appGraph.getElementState(id), nodeInfo.id)
    expect(hoverState).toContain('hover')

    // Move away
    await page.mouse.move(nodeInfo.sx + 300, nodeInfo.sy + 300)
    await page.waitForTimeout(500)

    const afterMoveState = await page.evaluate(id => window.__appGraph.getElementState(id), nodeInfo.id)
    expect(afterMoveState).not.toContain('hover')
  })

  test('点击节点显示 selected 状态并打开详情面板', async ({ page }) => {
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      if (!g) return null
      const nodes = g.getNodeData()
      if (!nodes.length) return null
      const node = nodes[0]
      const [sx, sy] = g.getClientByCanvas([node.style.x, node.style.y])
      return { id: node.id, sx, sy }
    })
    expect(nodeInfo).not.toBeNull()

    // Click node
    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(300)
    await page.mouse.click(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(500)

    // Check selected state
    const clickState = await page.evaluate(id => window.__appGraph.getElementState(id), nodeInfo.id)
    expect(clickState).toContain('selected')

    // Check detail panel opened (uses .node-detail-panel.open class)
    const panelVisible = await page.evaluate(() => {
      const panel = document.querySelector('.node-detail-panel.open')
      return !!panel
    })
    expect(panelVisible).toBeTruthy()
  })

  test('点击节点后 selected 状态可以通过代码清除', async ({ page }) => {
    const nodeInfo = await page.evaluate(() => {
      const g = window.__appGraph
      if (!g) return null
      const nodes = g.getNodeData()
      if (!nodes.length) return null
      const node = nodes[0]
      const [sx, sy] = g.getClientByCanvas([node.style.x, node.style.y])
      return { id: node.id, sx, sy }
    })
    expect(nodeInfo).not.toBeNull()

    // Click node
    await page.mouse.move(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(300)
    await page.mouse.click(nodeInfo.sx, nodeInfo.sy)
    await page.waitForTimeout(500)

    // Verify selected state
    let state = await page.evaluate(id => window.__appGraph.getElementState(id), nodeInfo.id)
    expect(state).toContain('selected')

    // Clear selected state programmatically
    await page.evaluate(id => window.__appGraph.setItemState(id, 'selected', false), nodeInfo.id)
    await page.waitForTimeout(300)

    // Verify cleared
    state = await page.evaluate(id => window.__appGraph.getElementState(id), nodeInfo.id)
    expect(state).not.toContain('selected')
  })
})
