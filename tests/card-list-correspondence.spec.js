import { test, expect } from '@playwright/test'

const PAGE = '/monitor/resource/card'

async function gotoResourceCard(page) {
  await page.goto(PAGE)
  await page.waitForSelector('.sub-card', { timeout: 10000 })
}

test('全部卡片与跳转列表数据对应', async ({ page }) => {
  await gotoResourceCard(page)

  await page.waitForTimeout(2500)

  const group = page.locator('.card-group').filter({ hasText: '业务应用' })
  await expect(group).toBeVisible()

  const subTotals = await group.locator('.sub-card-total').allInnerTexts()
  const totalSum = subTotals.reduce((sum, t) => {
    const m = t.match(/(\d+)\s*个/)
    return sum + (m ? Number(m[1]) : 0)
  }, 0)
  const groupTotalMatch = (await group.locator('.group-total').innerText()).match(/共\s*(\d+)\s*个/)
  const groupTotal = groupTotalMatch ? Number(groupTotalMatch[1]) : 0
  expect(totalSum).toBe(groupTotal)

  const card = group.locator('.sub-card').filter({ hasText: '重要应用' })
  await expect(card).toBeVisible()

  await expect(card.locator('.sub-card-total')).toContainText('4 个', { timeout: 10000 })

  const cardTotalText = (await card.locator('.sub-card-total').innerText()).replace(/\s+/g, ' ')
  const cardTotalMatch = cardTotalText.match(/(\d+)\s*个/)
  const cardAlertText = (await card.locator('.sub-card-alert').innerText()).replace(/\s+/g, ' ')
  const cardAlertMatch = cardAlertText.match(/(\d+)/)
  const cardTotal = cardTotalMatch ? Number(cardTotalMatch[1]) : 0
  const cardAlert = cardAlertMatch ? Number(cardAlertMatch[1]) : 0

  await card.click()
  await page.waitForTimeout(1500)

  await expect(page).toHaveURL(/\/monitor\/resource\/app\?sub=/)
  await expect(page.locator('.sub-category-tabs .ant-tabs-tab-active')).toContainText('重要应用')

  const rows = page.locator('.ant-table-tbody tr.ant-table-row')
  const rowCount = await rows.count()

  const alertRows = page.locator('.ant-table-tbody tr.ant-table-row').filter({
    has: page.locator('.alert-count'),
  })

  expect(rowCount).toBeGreaterThan(0)

  const mismatch = []
  if (rowCount !== cardTotal) mismatch.push(`列表行数 ${rowCount} !== 卡片 count ${cardTotal}`)
  const alertCount = await alertRows.count()
  if (alertCount !== cardAlert) mismatch.push(`列表紧急行数 ${alertCount} !== 卡片告警数 ${cardAlert}`)

  console.log(`[correspondence] cardTotal=${cardTotal} cardAlert=${cardAlert} rowCount=${rowCount} alertRows=${alertCount}`)
  expect(mismatch).toEqual([])
})
