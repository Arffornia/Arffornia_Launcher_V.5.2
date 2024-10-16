{ pkgs ? import <nixpkgs> {} }:
(pkgs.buildFHSUserEnv {
  name = "electron_env";
  targetPkgs = pkgs:
            (with pkgs; [
              alsa-lib
              atkmm
              at-spi2-atk
              cairo
              cups
              dbus
              expat
              glib
              glibc
              gtk2
              gtk3
              gtk4
              libdrm
              libxkbcommon
              mesa
              nspr
              nss
              nodePackages.pnpm
              nodejs_20
              pango
              udev
            ])
            ++ (with pkgs.xorg; [
              libXcomposite
              libXdamage
              libXext
              libXfixes
              libXrandr
              libX11
              xcbutil
              libxcb
            ]);
  runScript = "bash";
      profile = ''
       export LD_LIBRARY_PATH=${pkgs.glibc}/lib
     '';
}).env