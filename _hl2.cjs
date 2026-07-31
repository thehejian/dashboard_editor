const { chromium } = require('playwright');

async function snapAll(page) {
  return page.evaluate(() => {
    const cvs = document.querySelectorAll('.mt-canvas canvas')
    return Array.from(cvs).map((cv, i) => {
      const ctx = cv.getContext('2d')
      const w = cv.width, h = cv.height
      const d = ctx.getImageData(0, 0, w, h).data
      let filled = 0
      for (let p = 3; p < d.length; p += 4) if (d[p] > 10) filled++
      return { i, w, h, filled, data: Array.from(d) }
    })
  })
}
function diff(a, b) {
  if (!a || !b || a.length !== b.length) return null
  let count = 0
  const min = Math.min(a.length, b.length)
  for (let i = 0; i < min; i += 4) {
    if (Math.abs(a[i] - b[i]) > 12 || Math.abs(a[i + 1] - b[i + 1]) > 12 || Math.abs(a[i + 2] - b[i + 2]) > 12 || Math.abs(a[i + 3] - b[i + 3]) > 12) count++
  }
  return count
}

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
  const base = await snapAll(page)
  base.forEach(l => console.log(`Layer #${l.i}: ${l.w}x${l.h} filled=${l.filled}`))

  // hover exactly where the CDN node was found before (1028, 233)
  await page.mouse.move(1028, 233)
  await page.waitForTimeout(300)
  const during = await snapAll(page)
  console.log('during vs base:', during.map((l, i) => `#${l.i}:${diff(base[i].data, l.data)}`).join(' '))

  await page.mouse.move(box.x + 420, box.y + 213)
  await page.waitForTimeout(1000)
  const after = await snapAll(page)
  console.log('after vs base:', after.map((l, i) => `#${l.i}:${diff(base[i].data, l.data)}`).join(' '))
  await browser.close()
})()
