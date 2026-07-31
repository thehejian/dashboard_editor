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

  const base = await snap()
  await page.mouse.move(1028, 233)
  await page.waitForTimeout(300)
  const during = await snap()
  console.log('during vs base:', diff(base, during))

  await page.mouse.move(box.x + 420, box.y + 213)
  await page.waitForTimeout(1200)
  const after = await snap()
  console.log('after vs base:', diff(base, after))

  // force redraw and re-check
  await page.evaluate(() => window.__mtGraph?.draw())
  await page.waitForTimeout(500)
  const afterDraw = await snap()
  console.log('after draw() vs base:', diff(base, afterDraw))

  await page.evaluate(() => window.__mtGraph?.render())
  await page.waitForTimeout(500)
  const afterRender = await snap()
  console.log('after render() vs base:', diff(base, afterRender))

  await browser.close()
  console.log('done')
})().catch(e => { console.log('ERR:', e.message) })
