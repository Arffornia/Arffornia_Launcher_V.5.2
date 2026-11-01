// electron-builder config for "Arffornia Launcher Beta" (spec 016, phase 1).
//
// Used only by .github/workflows/beta.yml: `electron-builder --config electron-builder.beta.cjs`.
// It starts from package.json `build` (the live prod config; electron-builder ignores any
// electron-builder.yml when package.json has a `build` key) and changes only what makes the
// beta a separate app:
//   - its own app id and name, so it installs next to the prod launcher (own NSIS uninstall key,
//     own install folder, own Electron userData) and never replaces it;
//   - a badged icon;
//   - artifact names without spaces (GitHub turns spaces into dots, which would break the paths
//     in beta.yml / beta-linux.yml);
//   - the generic publish provider on the rolling `beta` pre-release, channel `beta`. Never the
//     GitHub provider: test/unit/channel.test.js checks it.
// Windows and Linux only for now (Brian's answer "Skip Mac").
const pkg = require('./package.json')

const BETA_FEED_URL = 'https://github.com/Arffornia/Arffornia_Launcher_V.5.2/releases/download/beta'
const PRODUCT_NAME = 'Arffornia Launcher Beta'
const base = pkg.build

module.exports = {
  ...base,
  appId: 'fr.arffornia.launcher.beta',
  productName: PRODUCT_NAME,
  // Written into the packaged package.json: Electron derives the app name and the userData
  // folder (cache, localStorage) from it, so the beta never shares them with the prod launcher.
  extraMetadata: { name: 'arffornia-launcher-beta', productName: PRODUCT_NAME },
  win: {
    ...base.win,
    icon: 'resources/img/beta/Crafting_Table.ico'
  },
  nsis: {
    ...base.nsis,
    installerIcon: 'resources/img/beta/Crafting_Table.ico',
    uninstallerIcon: 'resources/img/beta/Crafting_Table.ico',
    shortcutName: PRODUCT_NAME,
    artifactName: 'Arffornia-Launcher-Beta-Setup-${version}.${ext}'
  },
  linux: {
    ...base.linux,
    target: ['AppImage'],
    icon: 'resources/img/beta/Crafting_Table.png'
  },
  appImage: {
    artifactName: 'Arffornia-Launcher-Beta-${version}.${ext}'
  },
  publish: [{ provider: 'generic', url: BETA_FEED_URL, channel: 'beta' }]
}
