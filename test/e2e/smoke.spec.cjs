// Smoke and security checks on the built launcher (out/), with every remote endpoint mocked.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { test, expect, _electron: electron } = require('@playwright/test')
const { mockRemoteEndpoints } = require('./fixtures.cjs')

const APP_DIR = path.resolve(__dirname, '../..')

/**
 * Start the launcher in a throwaway working directory (game data is CWD-relative).
 * --no-sandbox: CI runners and containers cannot use Chromium's SUID / user-namespace sandbox.
 * The renderer isolation checked below (contextIsolation, no Node in the page) does not depend on it.
 */
async function launchApp(workDir) {
  const app = await electron.launch({
    args: ['--no-sandbox', APP_DIR],
    cwd: workDir,
    env: { ...process.env, NODE_ENV: 'production', ELECTRON_ENABLE_LOGGING: '1' }
  })
  const window = await app.firstWindow()
  // Requests from the Electron renderer are only intercepted at page level. Install the mocks,
  // then reload so the first data fetches go through them.
  const unexpected = await mockRemoteEndpoints(window)
  await window.reload()
  const errors = []
  window.on('pageerror', (err) => errors.push(String(err)))
  window.on('console', (msg) => {
    // WebGL is unavailable on headless CI machines (3D skin viewer); not an app error.
    if (msg.type() === 'error' && !/WebGL/i.test(msg.text())) errors.push(msg.text())
  })
  await window.waitForLoadState('domcontentloaded')
  return { app, window, errors, unexpected }
}

let workDir
test.beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-e2e-'))
})
test.afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

test('boots and renders Home from mocked endpoints', async () => {
  const { app, window, errors, unexpected } = await launchApp(workDir)
  try {
    await expect(window).toHaveTitle('Arffornia Launcher')
    await expect(window.locator('.mediumPlayBtn')).toBeVisible()
    await expect(window.getByText('Newest Item')).toBeVisible()
    await expect(window.getByText('Sale Item')).toBeVisible()
    await expect(window.getByText('Best Seller Item')).toBeVisible()
    expect(errors).toEqual([])
    expect(unexpected).toEqual([])
  } finally {
    await app.close()
  }
})

test('navigates across the main routes', async () => {
  const { app, window, errors } = await launchApp(workDir)
  try {
    await window.locator('nav a[href="/settings"]').click()
    await expect(window.locator('#page-title')).toBeVisible()
    await expect(window.locator('#lang-select')).toBeVisible()

    for (const href of ['/highlight', '/notification', '/shaders', '/']) {
      await window.locator(`nav a[href="${href}"]`).click()
      await expect(window).toHaveURL(new RegExp(`${href.replace('/', '\\/')}$`))
    }
    await expect(window.locator('.mediumPlayBtn')).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    await app.close()
  }
})

test('language choice persists across restarts', async () => {
  let run = await launchApp(workDir)
  try {
    await run.window.locator('nav a[href="/settings"]').click()
    await run.window.locator('#lang-select').selectOption('fr')
    await expect(run.window.locator('#page-title')).toHaveText(/Paramètres/)
  } finally {
    await run.app.close()
  }

  run = await launchApp(workDir)
  try {
    await run.window.locator('nav a[href="/settings"]').click()
    await expect(run.window.locator('#page-title')).toHaveText(/Paramètres/)
    await expect(run.window.locator('#lang-select')).toHaveValue('fr')
  } finally {
    await run.app.close()
  }
})

test('renderer has no Node.js access and only the curated API', async () => {
  const { app, window } = await launchApp(workDir)
  try {
    const probe = await window.evaluate(() => ({
      require: typeof window.require,
      process: typeof window.process,
      electron: typeof window.electron,
      api: typeof window.api,
      ipcRenderer: typeof window.api?.ipcRenderer
    }))
    expect(probe).toEqual({
      require: 'undefined',
      process: 'undefined',
      electron: 'undefined',
      api: 'object',
      ipcRenderer: 'undefined'
    })

    const webPreferences = await app.evaluate(({ BrowserWindow }) => {
      const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
      return {
        sandbox: prefs.sandbox,
        contextIsolation: prefs.contextIsolation,
        nodeIntegration: prefs.nodeIntegration,
        webSecurity: prefs.webSecurity
      }
    })
    expect(webPreferences).toEqual({
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    })
  } finally {
    await app.close()
  }
})

test('a Content-Security-Policy is set', async () => {
  const { app, window } = await launchApp(workDir)
  try {
    const csp = await window
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')
    expect(csp).toContain("script-src 'self'")
  } finally {
    await app.close()
  }
})
