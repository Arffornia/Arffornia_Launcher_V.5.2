# Arffornia Launcher Beta on NixOS (spec 016, phase 1):
#
#   nix run github:Arffornia/Arffornia_Launcher_V.5.2#beta
#
# The beta is rebuilt on every push to main into the rolling `beta` pre-release, so a pinned
# hash (like nix/release.json for the stable package) would be stale within hours. This package
# is a small runner instead. At each start it:
#   1. reads beta-linux.yml from the `beta` pre-release (version, file name, sha512);
#   2. downloads the AppImage into ~/.cache/arffornia-beta when that version is not cached yet,
#      and checks its sha512 before keeping it (a mismatch is deleted, never run);
#   3. runs it with appimage-run, with the same game libraries as the stable package, from
#      $HOME, so the beta's data lands in ~/.Arffornia_beta (never ~/.Arffornia_V.5.2).
# Offline, it runs the newest cached beta. `--fetch-only` downloads and checks without running
# (used by CI). ARFFORNIA_BETA_URL overrides the release URL (tests).
{
  appimage-run,
  writeShellApplication,
  makeDesktopItem,
  symlinkJoin,
  curl,
  coreutils,
  gnused,
  gnugrep,
  openssl,
}:

let
  pname = "arffornia-launcher-beta";

  runner = writeShellApplication {
    name = pname;
    runtimeInputs = [
      (appimage-run.override { extraPkgs = import ./game-libs.nix; })
      curl
      coreutils
      gnused
      gnugrep
      openssl
    ];
    text = ''
      base="''${ARFFORNIA_BETA_URL:-https://github.com/Arffornia/Arffornia_Launcher_V.5.2/releases/download/beta}"
      cache="''${XDG_CACHE_HOME:-$HOME/.cache}/arffornia-beta"
      mkdir -p "$cache"

      fetch_only=0
      if [ "''${1:-}" = "--fetch-only" ]; then
        fetch_only=1
        shift
      fi

      file=""
      if yml=$(curl -fsSL --retry 3 --connect-timeout 10 "$base/beta-linux.yml"); then
        version=$(sed -n 's/^version: *//p' <<< "$yml" | head -n 1)
        file=$(sed -n 's/^path: *//p' <<< "$yml" | head -n 1)
        sha=$(sed -n 's/^sha512: *//p' <<< "$yml" | head -n 1)
        if ! grep -Eq '^Arffornia-Launcher-Beta-[0-9A-Za-z.+-]+\.AppImage$' <<< "$file" || [ -z "$sha" ]; then
          echo "arffornia-launcher-beta: unexpected beta-linux.yml (path: $file)" >&2
          exit 1
        fi
        if [ ! -f "$cache/$file" ]; then
          echo "Downloading Arffornia Launcher Beta $version..." >&2
          tmp=$(mktemp "$cache/.download.XXXXXX")
          trap 'rm -f "$tmp"' EXIT
          curl -fL --progress-bar --retry 3 --connect-timeout 10 -o "$tmp" "$base/$file"
          got=$(openssl dgst -sha512 -binary "$tmp" | base64 -w0)
          if [ "$got" != "$sha" ]; then
            echo "arffornia-launcher-beta: sha512 mismatch for $file, not running it" >&2
            exit 1
          fi
          chmod +x "$tmp"
          mv "$tmp" "$cache/$file"
          trap - EXIT
          # Keep only the current beta.
          find "$cache" -maxdepth 1 -name 'Arffornia-Launcher-Beta-*.AppImage' ! -name "$file" -delete
        fi
      else
        file=$(find "$cache" -maxdepth 1 -name 'Arffornia-Launcher-Beta-*.AppImage' -printf '%T@ %f\n' \
          | sort -rn | head -n 1 | cut -d' ' -f2-)
        if [ -z "$file" ]; then
          echo "arffornia-launcher-beta: cannot reach $base and no beta is cached" >&2
          exit 1
        fi
        echo "arffornia-launcher-beta: offline, running the cached $file" >&2
      fi

      if [ "$fetch_only" = 1 ]; then
        echo "$cache/$file"
        exit 0
      fi

      # The launcher keeps its data relative to the working directory (issue #42).
      cd "$HOME"
      exec appimage-run "$cache/$file" "$@"
    '';
  };

  desktopItem = makeDesktopItem {
    name = pname;
    desktopName = "Arffornia Launcher Beta";
    genericName = "Minecraft launcher (beta)";
    comment = "Test builds of the Arffornia launcher, from main";
    extraConfig = {
      "Comment[fr]" = "Versions de test du lanceur Arffornia, depuis main";
    };
    exec = pname;
    icon = pname;
    categories = [ "Game" ];
    startupWMClass = "Arffornia Launcher Beta";
  };
in
symlinkJoin {
  name = "${pname}-runner";
  paths = [ runner ];
  postBuild = ''
    install -Dm444 ${desktopItem}/share/applications/${pname}.desktop \
      $out/share/applications/${pname}.desktop
    install -Dm444 ${../resources/img/beta/Crafting_Table.png} \
      $out/share/icons/hicolor/512x512/apps/${pname}.png
  '';
  meta = {
    description = "Arffornia Launcher Beta: runs the newest build from main (rolling beta pre-release)";
    homepage = "https://github.com/Arffornia/Arffornia_Launcher_V.5.2/releases/tag/beta";
    platforms = [ "x86_64-linux" ];
    mainProgram = pname;
  };
}
