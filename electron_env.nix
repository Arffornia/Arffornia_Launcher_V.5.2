{ pkgs ? import <nixpkgs> {
    config = {
      permittedInsecurePackages = [
        "nodejs-20.20.2"
      ];
    };
  }
}:
(pkgs.buildFHSEnv {
  name = "electron_env";
  targetPkgs = pkgs: (with pkgs; [
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
    libgbm
    libxkbcommon
    mesa
    libglvnd
    nspr
    nss
    pnpm
    nodejs_22 # Updated to Node 22 LTS (prevents EOL/insecure warning)
    pango
    udev
    zlib
    squashfsTools

    # Modern X11 libraries (replaces deprecated 'xorg.*' package set)
    libxcomposite
    libxdamage
    libxext
    libxfixes
    libxrandr
    libx11
    libxcb-util
    libxcb
  ]);
  runScript = "bash";
  profile = ''
    export LD_LIBRARY_PATH=${pkgs.mesa}/lib:${pkgs.libglvnd}/lib:${pkgs.glibc}/lib
  '';
}).env
