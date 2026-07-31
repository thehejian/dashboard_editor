const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://admin:745544752@localhost:5173/monitor/resource/card', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.locator('.res-card', { hasText: '订单服务中心' }).first().click()
  await page.waitForTimeout(600)
  await page.locator('.rdp-tabs .ant-tabs-tab', { hasText: '依赖关系' }).click()
  await page.waitForTimeout(1800)

  const box = await page.locator('.mt-canvas').boundingBox()
  await page.mouse.move(box.x + 420, box.y + 213)
  await page.waitForTimeout(600)

  const snap = () => page.evaluate(() => {
    const cv = document.querySelectorAll('.mt-canvas canvas')[1]
    const ctx = cv.getContext('2d')
    return Array.from(ctx.getImageData(0, 0, cv.width, cv.height).data)
  })
  const diff = (a, b) => {
    if (!a || !b) return null
    let count = 0
    const min = Math.min(a.length, b.length)
    for (let i = 0; i < min; i += 4) {
      if (Math.abs(a[i] - b[i]) > 12 || Math.abs(a[i + 1] - b[i + 1]) > 12 || Math.abs(a[i + 2] - b[i + 2]) > 12 || Math.abs(a[i + 3] - b[i + 3]) > 12) count++
    }
    return count
  }

  const dumpShape = (label) => page.evaluate((l) => {
    const g = window.__mtGraph
    const out = {}
    try {
      const el = g.context.element.getElement('mysql')
      const sm = el.shapeMap
      out.label = l
      out.opacity = sm.key?.style?.opacity
      out.fill = sm.key?.style?.fill
      out.shadow = sm.key?.style?.shadowColor
      out.labelOpacity = sm.label?.style?.opacity
      out.labelBg = sm.labelBackground?.style?.opacity
      out.state = g.getElementState('mysql')
    } catch (e) { out.err = e.message }
    return out
  }, label)

  const base = await snap()
  console.log('BASELINE:', JSON.stringify(await dumpShape('base')))

  await page.evaluate(async () => { await window.__mtGraph.setElementState('mysql', 'dimmed') })
  await page.waitForTimeout(500)
  console.log('DIMMED:', JSON.stringify(await dumpShape('dimmed')))
  const d1 = await snap()
  console.log('diff dimmed vs base:', diff(base, d1))

  await page.evaluate(async () => { await window.__mtGraph.setElementState('mysql', [], true) })
  await page.waitForTimeout(1500)
  console.log('CLEARED:', JSON.stringify(await dumpShape('cleared')))
  const c1 = await snap()
  console.log('diff cleared vs base:', diff(base, c1))

  await browser.close()
  console.log('done')
})().catch(e => { console.log('ERR:', e.message) })
