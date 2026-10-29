# Contributing

Thanks for helping. Read [AGENTS.md](AGENTS.md) for the repo map, conventions and gotchas.

## Setup

```bash
npm ci
npm run dev
```

## Workflow

1. Open or pick an issue. Behaviour changes need an issue first.
2. Branch from `main`: `fix/<slug>`, `feat/<slug>`, `security/<slug>`, `test/<slug>`, `ci/<slug>`,
   `docs/<slug>` or `chore/<slug>`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/), e.g.
   `fix(launcher): reset the Play button when launch fails`.
4. Run `make check` (lint, tests, build). It must pass.
5. Open a pull request using the template (What / Why / How it was tested / Risk & revert) and link the
   issue with `Closes #n`. One issue per PR.

## Rules

- English for code, comments, docs, commits, issues and PRs.
- Player-facing text goes through vue-i18n with at least `en` and `fr`
  (`src/renderer/src/i18n/locales/`).
- Improve the `@arffornia/nexus_*` libraries instead of replacing them with third-party packages.
- Never commit secrets or tokens.
