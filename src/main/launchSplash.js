import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { logger } from '.'

export const FIRST_FRAME_MARKER = '[arffornia-earlywindow] FIRST_FRAME'
export const SPLASH_TIMEOUT_MS = 60_000
export const CROSSFADE_MS = 300
// NeoForge's early window size, centred on the primary display like FML does, so the handoff lines up.
export const SPLASH_WIDTH = 854
export const SPLASH_HEIGHT = 480
const FADE_STEP_MS = 16

function centredOnPrimaryDisplay() {
  const { bounds } = screen.getPrimaryDisplay()
  return {
    x: Math.round(bounds.x + (bounds.width - SPLASH_WIDTH) / 2),
    y: Math.round(bounds.y + (bounds.height - SPLASH_HEIGHT) / 2)
  }
}

/**
 * Opens the factory splash that covers JVM start, until the game paints its first frame.
 * @param {{ locale: string, gameVersion: string, loaderVersion: string }} options
 * @returns {{ watch: (launcher: import('events').EventEmitter) => void, hide: (reason: string) => void }}
 */
export function openLaunchSplash({ locale, gameVersion, loaderVersion }) {
  const win = new BrowserWindow({
    ...centredOnPrimaryDisplay(),
    width: SPLASH_WIDTH,
    height: SPLASH_HEIGHT,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#0b1116',
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  let hiding = false
  let fadeTimer = null
  let markerTail = ''
  let watched = null

  const timeout = setTimeout(() => hide('timeout'), SPLASH_TIMEOUT_MS)

  function hide(reason) {
    if (hiding) return
    hiding = true
    clearTimeout(timeout)
    watched?.off('data', onData)
    logger.info(`Launch splash: hiding (${reason}).`)
    if (win.isDestroyed()) return
    const startedAt = Date.now()
    fadeTimer = setInterval(() => {
      if (win.isDestroyed()) return clearInterval(fadeTimer)
      const progress = Math.min(1, (Date.now() - startedAt) / CROSSFADE_MS)
      win.setOpacity(1 - progress)
      if (progress >= 1) {
        clearInterval(fadeTimer)
        win.close()
      }
    }, FADE_STEP_MS)
  }

  function onData(chunk) {
    // stdout chunks can split the marker across two 'data' events
    const text = markerTail + String(chunk)
    if (text.includes(FIRST_FRAME_MARKER)) hide('first frame')
    markerTail = text.slice(-(FIRST_FRAME_MARKER.length - 1))
  }

  function watch(launcher) {
    watched = launcher
    launcher.on('data', onData)
    launcher.on('close', () => hide('game exited'))
  }

  win.once('ready-to-show', () => {
    if (!hiding) win.show()
  })
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.on('closed', () => {
    hiding = true
    clearTimeout(timeout)
    clearInterval(fadeTimer)
  })

  const query = { lang: locale, mc: gameVersion, neoforge: loaderVersion }
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}/splash/index.html?${new URLSearchParams(query)}`
    )
  } else {
    win.loadFile(join(__dirname, '../renderer/splash/index.html'), { query })
  }

  return { watch, hide }
}
