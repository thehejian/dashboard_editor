import { test, expect } from '@playwright/test'

const BASE = 'http://admin:745544752@localhost:5173'

test.describe('侧边导航延迟展开', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/obs/overview', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(2000)
  })

  test('快速划过侧栏(<2s)不展开', async ({ page }) => {
    const sidebar = page.locator('.site-sidebar')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()

    // Move into sidebar center
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)
    // Wait only 1s (less than 2s threshold)
    await page.waitForTimeout(1000)

    // Should NOT have expanded class
    const hasExpanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(hasExpanded).toBe(false)

    // Width should still be ~48px
    const width = await sidebar.evaluate(el => el.getBoundingClientRect().width)
    expect(width).toBeLessThanOrEqual(50)
  })

  test('停留>2s侧栏展开', async ({ page }) => {
    const sidebar = page.locator('.site-sidebar')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)

    // Wait 2.5s (> 2s threshold)
    await page.waitForTimeout(2500)

    const hasExpanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(hasExpanded).toBe(true)

    const width = await sidebar.evaluate(el => el.getBoundingClientRect().width)
    expect(width).toBeGreaterThan(100)
  })

  test('展开后鼠标移出，侧栏在0.3s内收回', async ({ page }) => {
    const sidebar = page.locator('.site-sidebar')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    // Hover and wait for expand
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(2500)

    let hasExpanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(hasExpanded).toBe(true)

    // Move mouse far away to trigger leave
    await page.mouse.move(cx + 500, cy)

    // Check immediately (within 0.3s) — should still be expanded
    await page.waitForTimeout(100)
    const stillExpandedImmediate = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(stillExpandedImmediate).toBe(true)

    // Wait for leave delay (0.3s) to fire
    await page.waitForTimeout(400)
    const afterLeave = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(afterLeave).toBe(false)

    const width = await sidebar.evaluate(el => el.getBoundingClientRect().width)
    expect(width).toBeLessThanOrEqual(50)
  })

  test('快速划过不展开：完整流程(进入→离开→再进入)', async ({ page }) => {
    const sidebar = page.locator('.site-sidebar')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    // Enter, stay 0.8s, leave
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(800)
    await page.mouse.move(cx + 500, cy)
    await page.waitForTimeout(500)

    // Verify not expanded
    const notExpanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(notExpanded).toBe(false)

    // Enter again, stay 0.5s, leave
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(500)
    await page.mouse.move(cx + 500, cy)
    await page.waitForTimeout(500)

    const stillNotExpanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(stillNotExpanded).toBe(false)

    // Now enter and stay >2s
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(2500)
    const expanded = await sidebar.evaluate(el => el.classList.contains('expanded'))
    expect(expanded).toBe(true)
  })
})
