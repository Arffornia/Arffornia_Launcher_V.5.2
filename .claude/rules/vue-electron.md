---
paths:
  - "src/**/*.js"
  - "src/**/*.vue"
  - "src/**/*.mjs"
  - "electron.vite.config.mjs"
  - "electron-builder.yml"
  - "package.json"
---

# Electron + Vue conventions (Arffornia_Launcher_V.5.2)

- **Three processes, hard boundaries.** `src/main` (Node, trusted), `src/preload` (bridge),
  `src/renderer` (Vue, treat as web content). The renderer never imports `src/main`, `src/preload`,
  Node built-ins or `electron`; main never imports the renderer. Shared constants go in `src/shared/`.
  Guarded by `make arch` (dependency-cruiser); the error text says how to fix it.
- **The preload exposes only `window.api`**: one method per IPC channel, built with
  `ipcRenderer.invoke('<channel>', ...)`, subscriptions return an unsubscribe function. Never expose
  `ipcRenderer`, `electronAPI` (`@electron-toolkit/preload`) or `webFrame`. Guarded by
  `tools/check-preload-exposure.mjs`.
- **Every `ipcMain.handle` validates its input and its sender.** Signature is `(event, ...args)`
  (the first argument is the event, not data). Check types, allow-list values, confine file names
  with `path.basename` + extension, restrict URLs (`https:` + host allow-list) before `shell.openExternal`
  or downloads, and check `event.senderFrame.url` is the app.
- **BrowserWindow stays locked down**: `contextIsolation: true`, `nodeIntegration: false`; do not add
  `webSecurity: false` or new `sandbox: false` uses.
- **Downloads are verified**: hash against the publisher's checksum, write to a temp file, then rename.
- **Never log tokens** (MS refresh token, MC access token, `--accessToken`); redact before NexusLogger.
- **Owner libraries stay**: `@arffornia/nexus_java`, `nexus_logger`, `nexus_saver`, `nexus_mods` are
  improved, never replaced.
- **UI text through vue-i18n** with keys in both `src/renderer/src/i18n/locales/en.json` and `fr.json`;
  no hardcoded strings in templates or stores (`$t('...')` / `useI18n().t`).
- **Vue**: `<script setup>`, Pinia stores in `src/renderer/src/stores/`, HTTP clients in
  `src/renderer/src/js/`; remove listeners in `onUnmounted`.
- Verify with `make check` (lint + arch + test + build). Do not grow
  `.dependency-cruiser-known-violations.json` or `tools/preload-exposure-known.json`: they only shrink.
