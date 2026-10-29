# REVIEW.md — Arffornia_Launcher_V.5.2

How to review a change in this repo, for AI reviewers (`/arffornia:review`, the
`arffornia:reviewer` agent, `.github/workflows/claude-review.yml`) and humans.

## Output
- First line: `Findings: N (blocking b, major m, minor k) · risk: high|medium|low`.
- Every finding cites `path:line` and the evidence (quoted code, or a command and its output).
  No evidence: ask a question instead.
- At most 3 style remarks. Never approve; say what you did not verify.

## Depth by risk (`risk.yml` drives the CI depth)
| Risk | Paths | Depth |
|---|---|---|
| High | `src/preload/`, `src/main/ipcHandlers/`, `src/main/index.js` (window options, updater), auth/user/token code, downloaders and file writes, CSP in `index.html`, `electron-builder.yml`, deps, workflows | Every line, trace the IPC channel from renderer to handler, try to break it with hostile renderer input |
| Medium | other `src/main/`, renderer stores and HTTP clients, components | Every line, check tests cover it |
| Low | locales, assets, docs, tests only | Skim |

## Always check
- New/changed IPC: handler signature is `(event, ...args)`, arguments validated, sender checked; the
  preload adds one `window.api` method, never raw `ipcRenderer`.
- `make arch` stays green and the known-violations files did not grow.
- No token or credential in logs, settings files in plaintext, or renderer state.
- Downloads verified by hash and written atomically; paths confined to the game/shader dirs.
- `shell.openExternal` only with `https:` URLs on an allow-list.
- UI text via vue-i18n with keys in `en.json` and `fr.json`.
- Owner libraries (`@arffornia/nexus_*`) not replaced. `make check` output in the PR.

## Skip
- `package-lock.json` beyond the packages named in the PR, `out/`, `dist/`, binary assets,
  `.dependency-cruiser-known-violations.json` (generated; only check it shrinks).
