# Arffornia Launcher V.5.2

Official launcher of Arffornia, I'm remaking it, but this time using Electron, Vue.js and Vite.

### Website :

You can keep up to date with the project by visiting our website: [Click me :D !](https://arffornia.com/)

## Project Setup

### Install

```bash
$ git clone https://github.com/Arffornia/Arffornia_Launcher_V.5.2
```

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

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

This project is licensed under the MIT licence. You can consult the complete text of the licence in the file [LICENSE](LICENSE).
