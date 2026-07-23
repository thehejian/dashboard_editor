import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-results/report' }]],
  use: {
    baseURL: 'http://admin:745544752@localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && node server/server.js & npm run dev',
    url: 'http://admin:745544752@localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
