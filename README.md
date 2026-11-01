# Arffornia Launcher

The official desktop launcher for the [Arffornia](https://arffornia.com) Minecraft server. It is an
Electron + Vue 3 app that signs the player in with Microsoft, installs a Java 21 runtime, NeoForge and
the Arffornia modpack, then starts Minecraft 1.21.1. It also shows shop, podium and highlight data from
the website API, the server status, and a Modrinth shader browser. Within the Arffornia ecosystem it
consumes the website API (`Arffornia_Website`), the modpack manifests (`Arffornia_Network`,
`Arffornia_Provisioning`) and the owner's libraries `@arffornia/nexus_java`, `nexus_logger`,
`nexus_saver` and `nexus_mods`.

[Architecture docs (coming soon)](https://arffornia.github.io/docs/)

## Requirements

- Node.js 22 LTS and npm 10
- A desktop session to run the app (Windows, macOS or Linux). On NixOS, `nix-shell electron_env.nix`
  provides the libraries Electron needs.

## Quickstart

```bash
git clone https://github.com/Arffornia/Arffornia_Launcher_V.5.2
cd Arffornia_Launcher_V.5.2
npm ci
npm run dev
```

## Commands

| Command | What it does |
|---|---|
| `make check` | Lint, unit tests and build. Run it before every PR (CI runs the same steps). |
| `make lint` / `npm run lint` | ESLint, read-only. `npm run lint:fix` applies fixes. |
| `make test` | Unit tests. |
| `make build` / `npm run build` | Bundle main, preload and renderer into `out/` with electron-vite. |
| `make fmt` / `npm run format` | Format with Prettier (`npm run format:check` to only check). |
| `npm run dev` | Run with hot reload. |
| `npm start` | Preview the built app. |
| `npm run build:win` / `build:mac` / `build:linux` | Package installers into `dist/` with electron-builder. |

## Configuration

There are no environment variables or secrets needed for development.

- `src/main/launcherSettings.js`: game and loader versions, API endpoint (`https://arffornia.com/api/`),
  mod list and external-files manifest URLs, game and Java directories.
- Game data lives in `./.Arffornia_V.5.2` and the Java runtime in `./java`, **relative to the working
  directory the launcher was started from** (Windows, Linux). On macOS both live in
  `~/Library/Application Support/Arffornia/`, because apps opened from Finder start in `/`, which is
  read-only. The game directory holds `launcherOptions.json` (settings and
  login session, via Nexus_Saver), `launcher_log.txt`, the game files, `shaderpacks/` and
  `config/iris.properties`.
- Packaging is configured by the `build` field of `package.json`. `electron-builder.yml` is not used
  (see issue #48).

## Release process

1. Bump `version` in `package.json` and merge to `main`.
2. Push a tag `vX.Y.Z`. `.github/workflows/release.yml` builds Windows, macOS and Linux installers and
   publishes them to GitHub Releases.
3. Installed launchers pick up the new release through electron-updater (downloaded in the background,
   installed on quit).

## Beta launcher (testers)

Every push to `main` builds **Arffornia Launcher Beta** (`.github/workflows/beta.yml`) and publishes
it to the rolling [`beta` pre-release](https://github.com/Arffornia/Arffornia_Launcher_V.5.2/releases/tag/beta).
It is not for players:

- it installs next to the normal launcher (app id `fr.arffornia.launcher.beta`, its own install
  folder, shortcut and badged icon) and keeps its data in `.Arffornia_beta/` instead of `.Arffornia_V.5.2`;
- it updates only from the `beta` pre-release (`beta.yml`, `beta-linux.yml`). The normal launcher
  updates from `releases/latest`, which never returns a pre-release; a guard job checks it after
  every publish;
- Settings → Environment picks the game environment (Production only until the staging server exists).

Downloads: `Arffornia-Launcher-Beta-Setup-<version>.exe` on Windows (unsigned: SmartScreen →
*More info* → *Run anyway*), `Arffornia-Launcher-Beta-<version>.AppImage` on Linux
(`nix run nixpkgs#appimage-run -- <file>` on NixOS). Each pull request also gets the beta build as
Actions artifacts (`launcher-pr-<n>-windows`, `launcher-pr-<n>-linux`), with self-update off.
No macOS beta for now.

The flavour comes from one build-time constant, `ARFFORNIA_CHANNEL=beta`
(`src/shared/channel.js`, `electron-builder.beta.cjs`). A build without it is the prod launcher,
unchanged.

## macOS

- Releases ship a separate build per CPU: `*-arm64.dmg` / `*-arm64-mac.zip` for Apple Silicon and
  `*.dmg` / `*-mac.zip` (no arch suffix) for Intel Macs. Both are built by `release.yml` on the arm64
  `macos-latest` runner.
- The app is **ad-hoc signed, not notarized** (`"identity": "-"`, no Apple Developer ID yet). macOS
  blocks it on first open: open it once, then allow it in System Settings → Privacy & Security →
  "Open Anyway". Or run `xattr -dr com.apple.quarantine "/Applications/Arffornia Launcher.app"`.
  With a Developer ID: remove `identity`, set `CSC_LINK`/`CSC_KEY_PASSWORD` and the notarization
  secrets in `release.yml`, and drop `disable-library-validation` from
  `resources/entitlements.mac.plist`.
- Auto-update needs a signed app on macOS (Squirrel.Mac checks the signature), so unsigned macOS builds
  must be updated by downloading the new release.
- The launcher downloads an Azul Zulu JRE for the CPU it runs on (`aarch64` on Apple Silicon, also when
  an Intel build runs under Rosetta) through Nexus_Java.
- Develop on a Mac with the same commands as on Linux (`npm ci`, `make check`, `npm run dev`).
  `npm run build:mac` packages both architectures locally (ad-hoc signed). CI runs `make check` and
  an ad-hoc signed package + launch smoke test on `macos-latest` (job `check-macos`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Report security issues privately, see
[SECURITY.md](SECURITY.md).

## Install on NixOS / with Nix

No AppImage runner needed. Run it once:

```bash
nix run github:Arffornia/Arffornia_Launcher_V.5.2
```

Or install it, with a menu entry and icon (KDE, GNOME, ...), in your NixOS flake:

```nix
# flake.nix inputs
arffornia.url = "github:Arffornia/Arffornia_Launcher_V.5.2";

# configuration.nix (or home-manager home.packages)
environment.systemPackages = [ inputs.arffornia.packages.x86_64-linux.default ];
```

The package wraps the released AppImage in an FHS sandbox, so the Java runtime and the
Minecraft libraries the launcher downloads work as on any Linux. It updates with
`nix flake update`, not with the in-app updater. Maintainers: after a release, run
`nix/update.sh` (or `nix/update.sh v0.1.16`) and commit `nix/release.json`.

## License

MIT, see [LICENSE](LICENSE).
