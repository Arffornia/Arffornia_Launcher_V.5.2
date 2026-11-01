import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { isTrustedSenderUrl } from './ipcValidation'

/**
 * True if the IPC event comes from the top-level frame of the app's own renderer.
 * @param {Electron.IpcMainInvokeEvent} event
 */
export function isTrustedSender(event) {
  const frame = event?.senderFrame
  // Only the top-level frame of our own page; never iframes.
  if (!frame || frame.parent) return false
  return isTrustedSenderUrl(frame.url, {
    isDev: is.dev,
    devServerUrl: process.env['ELECTRON_RENDERER_URL']
  })
}

/**
 * True if the main window may navigate to `url` (reloads of the app page only).
 * @param {string} url
 * @param {string} currentUrl
 */
export function isAllowedNavigation(url, currentUrl) {
  const strip = (u) => String(u).split('#')[0]
  if (strip(url) === strip(currentUrl)) return true
  if (!is.dev || !process.env['ELECTRON_RENDERER_URL']) return false
  try {
    return new URL(url).origin === new URL(process.env['ELECTRON_RENDERER_URL']).origin
  } catch {
    return false
  }
}

/**
 * Drop-in replacement for `ipcMain.handle` that rejects calls from untrusted senders.
 * Argument validation is done by each handler (see ./ipcValidation.js).
 * @param {string} channel
 * @param {(event: Electron.IpcMainInvokeEvent, ...args: any[]) => any} listener
 */
export function handle(channel, listener) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      throw new Error(`Rejected IPC call on '${channel}' from an untrusted sender`)
    }
    return listener(event, ...args)
  })
}
