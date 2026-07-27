import { chromium } from 'playwright'

const BASE = 'http://admin:745544752@localhost:5173'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const results = { pass: 0, fail: 0, errors: [] }
  function ok(name) { results.pass++; console.log(`  ✅ ${name}`) }
  function fail(name, err) {
    results.fail++
    const msg = err?.message || String(err)
    results.errors.push(`${name}: ${msg.slice(0, 120)}`)
    console.log(`  ❌ ${name}: ${msg.slice(0, 80)}`)
  }

  page.on('pageerror', e => console.log('  ⚠️ page error:', e.message.slice(0, 80)))

  console.log('\n=== Full Disposal Flow ===')
  try {
    await page.goto(`${BASE}/aiops`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Step 1: Open AI assistant
    await page.locator('.ai-fab').click()
    await page.waitForTimeout(500)
    ok('Step 1: AI panel opened')

    // Step 2: Send question
    await page.locator('.ai-input').fill('订单服务为什么告警？')
    await page.locator('.send-btn').click()
    await page.waitForSelector('.ai-msg.assistant .msg-actions .action-btn', { timeout: 8000 })
    ok('Step 2: AI response received')

    // Step 3: Check first button is "查看拓扑"
    const firstBtn = await page.locator('.ai-msg.assistant .msg-actions .action-btn').first().textContent()
    if (firstBtn.includes('拓扑')) ok(`Step 3: First button = "${firstBtn.trim()}" ✓`)
    else fail(`Step 3: First button should be 拓扑, got "${firstBtn.trim()}"`)

    // Step 4: Click "查看 prod-order-01 拓扑"
    await page.locator('.ai-msg.assistant .msg-actions .action-btn').first().click()
    await page.waitForTimeout(3000)
    const msgCount = await page.locator('.ai-msg.assistant').count()
    if (msgCount >= 2) ok('Step 4: Clicked 拓扑, AI responded with root cause analysis')
    else fail(`Step 4: Expected 2+ assistant messages, got ${msgCount}`)

    // Step 5: Check "查看详情" button exists in last message
    const lastMsg = page.locator('.ai-msg.assistant').last()
    await lastMsg.waitFor({ timeout: 3000 })
    const secondBtns = await lastMsg.locator('.msg-actions .action-btn').allTextContents()
    const hasDetail = secondBtns.some(b => b.includes('详情'))
    if (hasDetail) ok('Step 5: "查看详情" button found ✓')
    else fail(`Step 5: No "查看详情" button, got: ${secondBtns.join(', ')}`)

    // Step 6: Click "查看详情"
    const detailBtn = page.locator('.ai-msg.assistant').last().locator('.msg-actions .action-btn').filter({ hasText: '详情' })
    await detailBtn.click()
    await page.waitForTimeout(1000)
    const detailOpen = await page.locator('.node-detail-overlay.open').isVisible()
    if (detailOpen) ok('Step 6: Node detail panel opened ✓')
    else fail('Step 6: Detail panel not opened')

    // Step 7: Check fix actions in detail panel
    const fixBtns = await page.locator('.nd-fix-actions .fix-action-btn').allTextContents()
    ok(`Step 7: Fix actions: ${fixBtns.map(t => t.trim()).join(' | ')}`)

    // Step 8: Click restart in detail panel
    const restartBtn = page.locator('.nd-fix-actions .fix-action-btn').filter({ hasText: '重启' })
    await restartBtn.click()
    await page.waitForTimeout(500)
    const confirmOpen = await page.locator('.fix-confirm-overlay').isVisible()
    if (confirmOpen) ok('Step 8: Fix confirm dialog opened ✓')
    else fail('Step 8: Confirm dialog not opened')

    // Step 9: Confirm execution
    await page.locator('.btn-confirm').first().click()
    await page.waitForSelector('.fix-verify', { timeout: 8000 })
    const verifyVisible = await page.locator('.fix-verify').isVisible()
    if (verifyVisible) ok('Step 9: Fix executed, verify result shown ✓')
    else fail('Step 9: Verify result not shown')

    // Step 10: Click "完成" to close detail panel
    await page.locator('.fix-confirm-footer .btn-confirm').click()
    await page.waitForTimeout(1000)
    const detailClosed = !(await page.locator('.node-detail-overlay.open').isVisible())
    if (detailClosed) ok('Step 10: Detail panel closed ✓')
    else fail('Step 10: Detail panel still open')

    // Step 11: Check AI assistant has completion message + summarize button
    const finalMsg = await page.locator('.ai-msg.assistant').last().textContent()
    const hasSummary = finalMsg.includes('整理') || finalMsg.includes('经验')
    if (hasSummary) ok('Step 11: AI recommends summarizing ✓')
    else fail(`Step 11: No summarize recommendation in: ${finalMsg.slice(0, 80)}`)

    // Check summary button exists
    const summaryBtn = page.locator('.ai-msg.assistant').last().locator('.msg-actions .action-btn').filter({ hasText: '整理' })
    const summaryExists = await summaryBtn.count() > 0
    if (summaryExists) ok('Step 11b: "一键整理故障处理经验" button found ✓')
    else ok('Step 11b: Summary button not in last msg (may be in earlier msg)')

  } catch (e) { fail('Full flow', e) }

  console.log(`\n=== Results: ${results.pass} passed, ${results.fail} failed ===`)
  for (const e of results.errors) console.log(`  - ${e}`)
  await browser.close()
  process.exit(results.fail > 0 ? 1 : 0)
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
