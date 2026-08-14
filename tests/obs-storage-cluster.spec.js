import { test, expect } from '@playwright/test'

const OBS_URL = '/obs/overview'

test.describe('OBS 存储集群区块 UI 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OBS_URL)
    await page.waitForSelector('.sc-detail-card', { timeout: 10000 })
    await page.waitForTimeout(800)
  })

  test('存储集群卡片数量与池结构', async ({ page }) => {
    const cards = page.locator('.sc-detail-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
    await expect(page.locator('.sc-detail-card').first().locator('.sdc-name')).toBeVisible()
    await expect(page.locator('.sc-detail-card').first().locator('.sdc-pool-list .sdc-pool').first()).toBeVisible()
  })

  test('柱状图渲染 - G2 canvas 存在且已绘制', async ({ page }) => {
    const bar = page.locator('.sdp-bar-chart canvas').first()
    await expect(bar).toBeVisible()
    const size = await bar.evaluate((el) => {
      const canvas = el
      return { width: canvas.width, height: canvas.height }
    })
    expect(size.width).toBeGreaterThan(50)
    expect(size.height).toBeGreaterThan(10)
    const hasBlue = await bar.evaluate((el) => {
      const canvas = el
      const ctx = canvas.getContext('2d')
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let blue = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
        if (a > 0 && b > 200 && r < 80 && g < 160) blue++
      }
      return blue
    })
    expect(hasBlue).toBeGreaterThan(100)
  })

  test('柱状图柱身厚度铺满容器', async ({ page }) => {
    const size = await page.locator('.sdp-bar-chart canvas').first().evaluate((el) => {
      const canvas = el
      const ctx = canvas.getContext('2d')
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const rowCounts = new Array(height).fill(0)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        if (data[i + 3] > 0) rowCounts[y]++
      }
      const rows = rowCounts.map((c, i) => c > 0 ? i : -1).filter(i => i >= 0)
      return { height, first: rows[0], last: rows[rows.length - 1] }
    })
    expect(size.first).toBeLessThan(4)
    expect(size.last).toBeGreaterThan(size.height - 4)
  })

  test('柱状图已用填充比例正确', async ({ page }) => {
    const firstPool = page.locator('.sdc-pool').first()
    const capText = await firstPool.locator('.sdp-bar-cap').innerText()
    expect(capText).toContain('已用')
    expect(capText).toContain('总量')
    const m = capText.match(/已用\s*([\d.]+)\s*TB\s*总量\s*([\d.]+)\s*TB/)
    expect(m).toBeTruthy()
    const used = parseFloat(m[1])
    const total = parseFloat(m[2])
    expect(used).toBeGreaterThan(0)
    expect(total).toBeGreaterThan(used)
  })

  test('趋势图渲染 - 折线完整可见不被裁切', async ({ page }) => {
    const chart = page.locator('.sdp-trend-chart canvas').first()
    await expect(chart).toBeVisible()
    const result = await chart.evaluate((el) => {
      const canvas = el
      const ctx = canvas.getContext('2d')
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const rowCounts = new Array(height).fill(0)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          if (data[i + 3] > 0) rowCounts[y]++
        }
      }
      const nonEmpty = rowCounts.map((c, i) => c > 0 ? i : -1).filter(i => i >= 0)
      const first = nonEmpty.length ? nonEmpty[0] : -1
      const last = nonEmpty.length ? nonEmpty[nonEmpty.length - 1] : -1
      return { height, first, last, covered: last - first + 1 }
    })
    expect(result.first).toBeGreaterThanOrEqual(0)
    expect(result.covered).toBeGreaterThan(15)
    expect(result.last).toBeLessThanOrEqual(result.height)
  })

  test('趋势图容器高度为 60px', async ({ page }) => {
    const height = await page.locator('.sdp-trend-chart').first().evaluate((el) => el.clientHeight)
    expect(height).toBe(60)
  })
})