import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

// Build flavour (spec 016): ARFFORNIA_CHANNEL=beta builds "Arffornia Launcher Beta", unset builds
// the prod launcher unchanged. ARFFORNIA_UPDATES=0 turns self-update off (per-PR artifacts).
// ARFFORNIA_VERSION overrides the version shown in Settings (beta.yml sets 0.1.16-beta.<run>).
// Read in src/shared/channel.js.
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
const define = {
  __ARFFORNIA_CHANNEL__: JSON.stringify(process.env.ARFFORNIA_CHANNEL || ''),
  __ARFFORNIA_UPDATES__: JSON.stringify(process.env.ARFFORNIA_UPDATES !== '0'),
  __ARFFORNIA_VERSION__: JSON.stringify(process.env.ARFFORNIA_VERSION || pkg.version)
}

export default defineConfig({
  main: {
    define,
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    define,
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    define,
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve(__dirname, 'src'),
        '@res': resolve(__dirname, 'resources')
      }
    },
    plugins: [vue()]
  }
})
