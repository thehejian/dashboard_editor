import { test } from '@playwright/test'

test('学习阿里云 CMS 页面布局结构', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1200 })
  await page.goto('https://sls.aliyun.com/doc/playground/cmsdemo.html', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)
  const frame = page.frameLocator('iframe.frame')
  await page.waitForTimeout(6000)

  const layout = await frame.locator('body').evaluate((body) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'
    }
    // Top-level visible blocks with their geometry, skip SVG/icons
    const blocks = [...body.querySelectorAll('div, main, aside, section, header, nav')]
      .filter(el => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join('.') : ''),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        }
      })
      .filter(b => b.w >= 120 && b.h >= 40)
      .sort((a, b) => a.y - b.y || a.x - b.x)
    return blocks
  }).catch(e => 'ERR: ' + e.message)
  console.log('===== LAYOUT BLOCKS =====')
  for (const b of layout) console.log(`[${b.y},${b.x}] ${b.w}x${b.h} ${b.tag}.${b.cls} :: ${b.text}`)
})
