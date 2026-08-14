import { test, expect } from '@playwright/test'

const OBS_URL = '/obs/overview'

test.describe('OBS 运维页面侧滑测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OBS_URL)
    await page.waitForSelector('.obs-ops', { timeout: 10000 })
  })

  test('页面基础加载', async ({ page }) => {
    await expect(page.locator('.obs-ops-header h3')).toContainText('OBS 运维监控')
    await expect(page.locator('.stat-card')).toHaveCount(10)
    await expect(page.locator('.alarm-stat-card')).toHaveCount(4)
    await expect(page.locator('.alarm-list-wrap .ant-table-row')).toHaveCount(5)
    await expect(page.locator('.anatomy-block')).toHaveCount(2)
    await expect(page.locator('.tenant-table tbody tr')).toHaveCount(5)
  })

  test('统计卡片点击 - 区域列表', async ({ page }) => {
    await page.locator('.stat-card').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('区域')
    await expect(page.locator('.detail-scroll .ant-table')).toBeVisible()
    const rows = page.locator('.detail-scroll .ant-table-tbody .ant-table-row')
    await expect(rows).toHaveCount(2)
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-panel.open')).toHaveCount(0)
  })

  test('告警项点击 - 告警详情', async ({ page }) => {
    await page.locator('.alarm-list-wrap .ant-table-row').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('存储池')
    await expect(page.locator('.detail-scroll .detail-section').first()).toBeVisible()
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-panel.open')).toHaveCount(0)
  })

  test('集群卡片点击 - 集群详情', async ({ page }) => {
    const clusterCard = page.locator('.cluster-detail-card').first()
    await expect(clusterCard).toBeVisible()
    await clusterCard.click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('obs-cluster')
    await expect(page.locator('.detail-scroll .detail-info-grid')).toBeVisible()
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-panel.open')).toHaveCount(0)
  })

  test('存储集群卡片点击 - 存储集群详情', async ({ page }) => {
    const scCard = page.locator('.sc-detail-card').first()
    await expect(scCard).toBeVisible()
    await scCard.click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('存储集群')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('租户表格行点击 - 租户详情', async ({ page }) => {
    const tenantRow = page.locator('.tenant-table tbody tr').first()
    await expect(tenantRow).toBeVisible()
    await tenantRow.click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('tenant')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-panel.open')).toHaveCount(0)
  })

  test('遮罩层点击关闭侧滑', async ({ page }) => {
    await page.locator('.stat-card').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await page.locator('.detail-mask').click({ position: { x: 10, y: 10 }, force: true })
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-panel.open')).toHaveCount(0)
  })

  test('侧滑多级返回', async ({ page }) => {
    await page.locator('.stat-card').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('区域')
    await page.locator('.detail-scroll .ant-table-tbody .ant-table-row').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-title h3').last()).toContainText('华北')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('统计卡片 - 业务集群列表 a-table + 名称链接', async ({ page }) => {
    await page.locator('.stat-card').nth(1).click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('集群列表')
    const rows = page.locator('.detail-scroll .ant-table-tbody .ant-table-row')
    await expect(rows).toHaveCount(3)
    await expect(page.locator('.detail-scroll .ant-table-tbody .rld-link').first()).toBeVisible()
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('统计卡片 - 存储池列表 使用率进度条', async ({ page }) => {
    await page.locator('.stat-card').nth(3).click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('存储池列表')
    await expect(page.locator('.detail-scroll .ant-table-tbody .rld-usage').first()).toBeVisible()
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('统计卡片 - 桶列表 名称链接进桶详情', async ({ page }) => {
    await page.locator('.stat-card').nth(6).click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('桶列表')
    await page.locator('.detail-scroll .ant-table-tbody .rld-link').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-title h3').last()).toContainText('bucket')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('统计卡片 - 企业项目列表 进企业项目详情', async ({ page }) => {
    await page.locator('.stat-card').nth(9).click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await expect(page.locator('.detail-title h3')).toContainText('企业项目列表')
    await page.locator('.detail-scroll .ant-table-tbody .rld-link').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-title h3').last()).toContainText('企业项目')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('存储集群详情 - 存储池列表点击进存储池详情', async ({ page }) => {
    await page.locator('.sc-detail-card').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await page.locator('.detail-scroll .pool-card').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-scroll .dii-label').first()).toContainText('存储池名称')
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })

  test('存储池详情 - 所属节点表格', async ({ page }) => {
    await page.locator('.sc-detail-card').first().click()
    await page.waitForSelector('.detail-panel.open', { timeout: 5000 })
    await page.waitForTimeout(400)
    await page.locator('.detail-scroll .pool-card').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('.detail-scroll .ant-table-tbody .ant-table-row').first()).toBeVisible()
    await expect(page.locator('.detail-scroll .ant-table-tbody .rld-link').first()).toBeVisible()
    await page.locator('.detail-header .close-btn').click({ force: true })
    await page.waitForTimeout(500)
  })
})
