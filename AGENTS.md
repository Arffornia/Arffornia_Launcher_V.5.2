# AGENTS.md

Guide for AI agents and newcomers working on the Arffornia launcher.

## Purpose

Electron desktop launcher for the Arffornia Minecraft server: Microsoft login (msmc), Java 21 install
(Nexus_Java), NeoForge installer download, modpack sync (Nexus_Mods), game start (minecraft-launcher-core,
"MCLC"), plus website data (shop, podium, highlights), server status and a Modrinth shader browser.

## Repo map

| Path | What |
|---|---|
| `src/main/index.js` | App entry: window creation, auto-updater, handler registration, exports `logger`, `addNotification`, `getMainWindow` |
| `src/main/ipcHandlers/*.js` | `ipcMain.handle` registrations, one file per area |
| `src/main/minecraftManager.js` | Launch flow: auth, Java, NeoForge, mods, MCLC |
| `src/main/msAuthManager.js`, `user.js` | Microsoft auth and in-memory user state |
| `src/main/shaderManager.js` | Shaderpacks dir, `iris.properties`, shader metadata cache |
| `src/main/neoforgeDownloader.js` | NeoForge installer download |
| `src/main/progressManager.js` | Weighted global progress sent to the renderer (`globalProgress`) |
| `src/main/launcherSettings.js` | Versions, endpoints, directories |
| `src/preload/index.js` | `contextBridge` API exposed as `window.api` |
| `src/renderer/src/` | Vue 3 app: `pages/`, `components/`, `stores/` (Pinia), `js/` (HTTP clients), `i18n/` |
| `resources/` | Icons bundled with the app |
| `package.json#build` | electron-builder config (the real one; `electron-builder.yml` is ignored) |
| `.github/workflows/` | `ci.yml` (PR checks), `release.yml` (tag -> installers), `security.yml` (Trivy) |

## Commands

```bash
npm ci            # install (postinstall runs electron-builder install-app-deps)
make check        # lint + tests + build; must pass before a PR
make lint         # eslint . (read-only); npm run lint:fix to autofix
make test         # unit tests (Vitest, test/unit/)
make build        # electron-vite build -> out/
make fmt          # prettier --write .
npm run dev       # run the app (needs a display)
```

Typecheck: **N/A**. The launcher is plain JavaScript (ESM) with no TypeScript or `checkJs`.
Whether to adopt `// @ts-check` + JSDoc or migrate to TypeScript is an open decision for the owner.

## Conventions

- ESLint 9 flat config (`eslint.config.cjs`), Prettier (`.prettierrc.yaml`: single quotes, no
  semicolons, width 100). `*.mjs` is gitignored, so configs use `.cjs`.
- Main process logs go through the NexusLogger instance exported by `src/main/index.js`
  (`logger.info(message)` takes a single string argument). Renderer logs go through `window.api.logger`.
- Renderer talks to main only through `window.api` (preload). Add a named function there, never a
  generic channel.
- Branches `fix/<slug>`, `security/<slug>`, `test/<slug>`, `ci/<slug>`, `docs/<slug>`, `chore/<slug>`.
  Conventional Commits. One PR per issue, `Closes #n`.

## Hard rules

- English for code, comments, docs, commits, issues and PRs.
- Player-facing text goes through vue-i18n with `en` and `fr` (`src/renderer/src/i18n/locales/`).
  Never hardcode user-visible strings.
- Never replace the owner's libraries (`@arffornia/nexus_java`, `nexus_logger`, `nexus_saver`,
  `nexus_mods`) with third-party ones. Improve them in their own repos.
- Never commit secrets, tokens or real account data (also not in test fixtures or logs).
- Behaviour changes need an issue. Design decisions belong to the owner (label `needs-decision`).
- Security fixes for unfixed weaknesses: neutral issue/PR wording, no exploit details.
- Agents never merge, tag, release or push to `main`.

## Testing strategy

- Unit: Vitest. Main-process modules in the `node` environment with `vi.mock('electron')`; renderer
  stores and components with `happy-dom`. Tests must run offline (mock HTTP).
- E2E: Playwright for Electron under `xvfb-run`, with mocked endpoints. Never real Microsoft
  credentials in CI.
- The game launch itself (Java, NeoForge, MCLC) is verified manually by the maintainer.

## Gotchas

- Game and Java directories (`./.Arffornia_V.5.2`, `./java`) are relative to the **process working
  directory**, not the install dir. `open-local-game-file` resolves against the exe dir instead.
- Several main modules have side effects at import (`shaderManager` creates directories, Nexus_Saver
  creates its file, `minecraftManager` registers `is-game-running`). Modules import `'.'`
  (`src/main/index.js`) back, which creates circular imports: mock `'.'` in unit tests.
- The renderer imports `src/main/launcherSettings.js` directly (bundled twice).
- MCLC `debug` events contain the full launch command line.
- The mod list (`Arffornia_Network`) and external files (`Arffornia_Provisioning`) are fetched from
  mutable `main` branches on raw.githubusercontent.
- The Nexus libraries come from the public npm registry, not from git.

## Related repos

- `Arffornia/Arffornia_Website`: the API the launcher reads (`/api/...`).
- `Arffornia/Arffornia_Network`, `Arffornia/Arffornia_Provisioning`: modpack manifests and files.
- `Arffornia/Nexus_Java`, `Nexus_Logger`, `Nexus_Saver`, `Nexus_Mods`: owner libraries used here.
