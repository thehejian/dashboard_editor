import { chromium } from 'playwright'

const BASE = 'http://admin:745544752@localhost:5173'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const ok = []
  const fail = []
  function pass(name) { ok.push(name); console.log(`  ✅ ${name}`) }
  function no(name, e) { fail.push(`${name}: ${(e?.message||e||'').slice(0,100)}`); console.log(`  ❌ ${name}`) }

  page.on('pageerror', e => {
    if (!e.message.includes('setItemState')) console.log(`  ⚠️ ${e.message.slice(0, 80)}`)
  })

  console.log('\n=== Timeline Stage → Node Colors ===')

  try {
    await page.goto(`${BASE}/monitor/topology?tab=application&appTab=all`, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(2500)

    if (await page.locator('canvas').count()) pass('Canvas rendered')
    else { no('Canvas') }
    if (await page.locator('.incident-timeline').isVisible({ timeout: 8000 })) pass('Timeline visible')
    else { no('Timeline') }

    if (!(await page.evaluate(() => !!window.__appGraph))) { no('window.__appGraph'); await browser.close(); process.exit(1) }

    // Click stage helper (programmatic to avoid stale-element issues)
    async function clickStage(idx) {
      await page.evaluate((i) => {
        const s = document.querySelectorAll('.tl-stage')
        if (s[i]) s[i].click()
      }, idx)
      await page.waitForTimeout(600)
    }

    async function readNodes() {
      return page.evaluate(() => {
        const g = window.__appGraph
        return g.getNodeData().map(n => ({ id: n.id, status: n.data?.status }))
      })
    }

    const initData = await readNodes()
    const O = {}
    initData.forEach(n => { O[n.id] = n.status })
    console.log(`  default: ${['prod-order-01','lb-api','mysql-master','redis-cache'].map(k => `${k}=${O[k]}`).join(', ')}`)

    // ========= TESTS =========

    await clickStage(0) // s1 CPU突增
    let d = await readNodes()
    if (d.find(n => n.id === 'prod-order-01')?.status === 'critical') pass('s1: prod-order-01 → critical')
    else no('s1', `got ${d.find(n => n.id === 'prod-order-01')?.status}`)

    await clickStage(2) // s3 网关影响
    d = await readNodes()
    if (d.find(n => n.id === 'lb-api')?.status === 'warning') pass('s3: lb-api → warning')
    else no('s3', `got ${d.find(n => n.id === 'lb-api')?.status}`)

    await clickStage(6) // s7 AI检测
    d = await readNodes()
    if (d.find(n => n.id === 'prod-order-01')?.status === O['prod-order-01']) pass('s7: restored to original')
    else no('s7', `got ${d.find(n => n.id === 'prod-order-01')?.status}`)

    await clickStage(9) // s10 服务恢复
    d = await readNodes()
    const allNormal = ['prod-order-01','lb-api','mysql-master','redis-cache'].every(id => d.find(n => n.id === id)?.status === 'normal')
    if (allNormal) pass('s10: all nodes → normal')
    else {
      const bad = ['prod-order-01','lb-api','mysql-master','redis-cache']
        .filter(id => d.find(n => n.id === id)?.status !== 'normal')
        .map(id => `${id}=${d.find(n => n.id === id)?.status}`)
      no('s10', bad.join(', '))
    }

    // Canvas pixel check: after s10, most nodes should be blue (#1890ff)
    const pixel = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return {}
      const ctx = c.getContext('2d')
      const w = c.width, h = c.height
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
      const d = ctx.getImageData(cx - 50, cy - 50, 100, 100).data
      let blue = 0, red = 0, total = 0
      for (let i = 0; i < d.length; i += 12) {
        total++
        const r = d[i], g = d[i+1], b = d[i+2]
        if (b > 160 && r < 120 && g < 120) blue++
        if (r > 160 && g < 120 && b < 120) red++
      }
      return { bluePct: total ? Math.round(blue/total*100) : 0, redPct: total ? Math.round(red/total*100) : 0 }
    })
    console.log(`  Canvas center: blue=${pixel.bluePct}% red=${pixel.redPct}%`)
    if (pixel.bluePct >= 0) pass('Canvas readable')
    if (pixel.bluePct > pixel.redPct) pass('Canvas shows blue > red (all normal)')
    else no('Canvas pixel', `blue=${pixel.bluePct}% vs red=${pixel.redPct}%`)

  } catch (e) { no('Fatal', e) }

  console.log(`\n=== ${ok.length} passed, ${fail.length} failed ===`)
  for (const e of fail) console.log(`  - ${e}`)
  await browser.close()
  process.exit(fail.length > 0 ? 1 : 0)
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
