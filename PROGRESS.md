# PROGRESS.md — Arffornia_Launcher_V.5.2

Handoff between sessions (humans and agents). Newest first; keep it under ~60 lines and move
finished multi-session work to `docs/exec-plans/completed/`.

## Now
- Spec 016 phase 1 (testable build): beta launcher (`beta.yml`, `src/shared/channel.js`,
  `electron-builder.beta.cjs`); `release.yml` guard is a separate, held PR (#82); `.#beta` flake
  output follows once the first `beta` pre-release exists.
- Harness v2 pilot (`chore/harness-v2`, stacked on the foundation PR #54): agent-kit settings,
  Vue/Electron rules, REVIEW.md, risk.yml, golden principles, dependency-cruiser + preload guards in `make check`.

## Next
- Land the security PRs: #55 renderer isolation (removes the `@electron-toolkit/preload` import and
  `window.electron`: shrink `.dependency-cruiser-known-violations.json` with `npm run arch:baseline`
  and empty `tools/preload-exposure-known.json`), #56 IPC validation, #57 log redaction, #58 credential storage.
- Move `launcherSettings` constants used by the renderer (`js/arfforniaApi.js`, `js/modrinthApi.js`)
  to `src/shared/` or behind `window.api`; that clears the two `renderer-not-to-main` entries.

## Verify
- `make check` (lint + arch + test + build). `make arch` alone is ~2 s.

## Decisions waiting (needs-decision)
- See open issues labelled `needs-decision`.
