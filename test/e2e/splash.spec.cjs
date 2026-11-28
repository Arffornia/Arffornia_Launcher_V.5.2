// The launch splash page (spec 007 item 9) on the built app, without starting the game.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { test, expect, _electron: electron } = require('@playwright/test')
const { mockRemoteEndpoints } = require('./fixtures.cjs')

const APP_DIR = path.resolve(__dirname, '../..')
const SPLASH_PAGE = path.join(APP_DIR, 'out/renderer/splash/index.html')

let workDir
let app
test.beforeEach(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-e2e-'))
  app = await electron.launch({
    args: ['--no-sandbox', APP_DIR],
    cwd: workDir,
    env: { ...process.env, XDG_DATA_HOME: workDir, LOCALAPPDATA: workDir, NODE_ENV: 'production' }
  })
  const mainWindow = await app.firstWindow()
  await mockRemoteEndpoints(mainWindow)
})
test.afterEach(async () => {
  await app.close()
  fs.rmSync(workDir, { recursive: true, force: true })
})

async function openSplash(lang) {
  const opened = app.waitForEvent('window')
  await app.evaluate(
    ({ BrowserWindow }, { page, query }) => {
      const win = new BrowserWindow({
        width: 854,
        height: 480,
        frame: false,
        webPreferences: { sandbox: true, contextIsolation: true }
      })
      win.loadFile(page, { query })
    },
    { page: SPLASH_PAGE, query: { lang, mc: '1.21.1', neoforge: '21.1.172' } }
  )
  const splash = await opened
  const errors = []
  splash.on('pageerror', (err) => errors.push(String(err)))
  await splash.waitForLoadState('domcontentloaded')
  return { splash, errors }
}

const sceneIsPainted = (page) =>
  page.waitForFunction(() => {
    const canvas = document.getElementById('scene')
    if (!canvas.width) return false
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
    const lit = new Set()
    for (let i = 0; i < data.length; i += 4 * 97) lit.add(data[i] + data[i + 1] + data[i + 2])
    return lit.size > 20
  })

for (const [lang, stage, card] of [
  ['en', 'Starting Java & NeoForge', 'Did you know?'],
  ['fr', 'Démarrage de Java et NeoForge', 'Le saviez-vous ?']
]) {
  test(`splash paints the factory and shows the ${lang} boot stage`, async () => {
    const { splash, errors } = await openSplash(lang)

    await sceneIsPainted(splash)
    await expect(splash.locator('.stage')).toHaveText(stage)
    await expect(splash.locator('.dyk .label')).toHaveText(card)

    await splash.screenshot({ path: test.info().outputPath(`splash.${lang}.png`) })
    expect(errors).toEqual([])
  })
}
