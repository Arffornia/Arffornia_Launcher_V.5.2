import { EventEmitter } from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({ windows: [] }))

vi.mock('electron', async () => {
  const { EventEmitter } = await import('events')
  class FakeWindow extends EventEmitter {
    constructor(options) {
      super()
      this.options = options
      this.opacity = 1
      this.destroyed = false
      this.shown = false
      this.webContents = Object.assign(new EventEmitter(), { setWindowOpenHandler: vi.fn() })
      m.windows.push(this)
    }
    loadFile(path, options) {
      this.loaded = { path, query: options.query }
    }
    loadURL(url) {
      this.loaded = { url }
    }
    show() {
      this.shown = true
    }
    setOpacity(value) {
      this.opacity = value
    }
    isDestroyed() {
      return this.destroyed
    }
    close() {
      this.destroyed = true
      this.emit('closed')
    }
  }
  return {
    BrowserWindow: FakeWindow,
    screen: { getPrimaryDisplay: () => ({ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }) }
  }
})
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('../../src/main/index.js', () => ({ logger: { info: vi.fn() } }))

const {
  openLaunchSplash,
  FIRST_FRAME_MARKER,
  SPLASH_TIMEOUT_MS,
  CROSSFADE_MS,
  SPLASH_WIDTH,
  SPLASH_HEIGHT
} = await import('../../src/main/launchSplash.js')

function openWatchedSplash() {
  const launcher = new EventEmitter()
  const splash = openLaunchSplash({
    locale: 'fr',
    gameVersion: '1.21.1',
    loaderVersion: '21.1.172'
  })
  splash.watch(launcher)
  return { launcher, splash, win: m.windows.at(-1) }
}

beforeEach(() => {
  vi.useFakeTimers()
  m.windows.length = 0
})
afterEach(() => {
  vi.useRealTimers()
})

describe('launch splash', () => {
  it('opens a frameless fixed window the size of the NeoForge early window, centred on the primary display', () => {
    // Act
    const { win } = openWatchedSplash()

    // Assert
    expect(win.options).toMatchObject({
      width: SPLASH_WIDTH,
      height: SPLASH_HEIGHT,
      x: 533,
      y: 300,
      frame: false,
      resizable: false
    })
  })

  it('passes the launcher locale and game versions to the splash page', () => {
    // Act
    const { win } = openWatchedSplash()

    // Assert
    expect(win.loaded.query).toEqual({ lang: 'fr', mc: '1.21.1', neoforge: '21.1.172' })
  })

  it('shows the window once the page is ready', () => {
    // Arrange
    const { win } = openWatchedSplash()

    // Act
    win.emit('ready-to-show')

    // Assert
    expect(win.shown).toBe(true)
  })

  it('crossfades out and closes within 300 ms when the game prints its first frame marker', () => {
    // Arrange
    const { launcher, win } = openWatchedSplash()

    // Act
    launcher.emit('data', `[12:00:01] [main/INFO]: ${FIRST_FRAME_MARKER}\n`)
    vi.advanceTimersByTime(CROSSFADE_MS / 2)
    const midFade = win.opacity
    vi.advanceTimersByTime(CROSSFADE_MS)

    // Assert
    expect(midFade).toBeGreaterThan(0)
    expect(midFade).toBeLessThan(1)
    expect(win.destroyed).toBe(true)
  })

  it('detects the marker when stdout splits it across two chunks', () => {
    // Arrange
    const { launcher, win } = openWatchedSplash()
    const cut = 15

    // Act
    launcher.emit('data', `log line\n${FIRST_FRAME_MARKER.slice(0, cut)}`)
    launcher.emit('data', `${FIRST_FRAME_MARKER.slice(cut)}\n`)
    vi.advanceTimersByTime(CROSSFADE_MS + 50)

    // Assert
    expect(win.destroyed).toBe(true)
  })

  it('stays open on game output that only resembles the marker', () => {
    // Arrange
    const { launcher, win } = openWatchedSplash()

    // Act
    launcher.emit('data', '[arffornia-earlywindow] FIRST_FRAM\n[arffornia-earlywindow] READY\n')
    vi.advanceTimersByTime(CROSSFADE_MS + 50)

    // Assert
    expect(win.destroyed).toBe(false)
  })

  it('closes when the game process exits before its first frame', () => {
    // Arrange
    const { launcher, win } = openWatchedSplash()

    // Act
    launcher.emit('close', 1)
    vi.advanceTimersByTime(CROSSFADE_MS + 50)

    // Assert
    expect(win.destroyed).toBe(true)
  })

  it('closes when the launch fails', () => {
    // Arrange
    const { splash, win } = openWatchedSplash()

    // Act
    splash.hide('launch error')
    vi.advanceTimersByTime(CROSSFADE_MS + 50)

    // Assert
    expect(win.destroyed).toBe(true)
  })

  it('closes after 60 seconds without a first frame', () => {
    // Arrange
    const { win } = openWatchedSplash()

    // Act
    vi.advanceTimersByTime(SPLASH_TIMEOUT_MS - 1)
    const openBeforeTimeout = !win.destroyed
    vi.advanceTimersByTime(1 + CROSSFADE_MS + 50)

    // Assert
    expect(openBeforeTimeout).toBe(true)
    expect(win.destroyed).toBe(true)
  })

  it('never shows a window that was already hidden before its page loaded', () => {
    // Arrange
    const { launcher, win } = openWatchedSplash()
    launcher.emit('close', 0)

    // Act
    win.emit('ready-to-show')

    // Assert
    expect(win.shown).toBe(false)
  })
})
