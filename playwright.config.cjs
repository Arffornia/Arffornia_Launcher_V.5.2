// Playwright drives the built Electron app (out/). Run with `npm run test:e2e`
// (needs a display: use `xvfb-run -a npm run test:e2e` on a headless Linux machine).
const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
})
