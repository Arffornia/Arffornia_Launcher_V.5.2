# Arffornia Launcher for Nix and NixOS, built from the released AppImage.
#
# The AppImage runs inside an FHS sandbox (appimageTools.wrapType2), so the Java runtime
# and the Minecraft native libraries (LWJGL, OpenAL) that the launcher downloads at run
# time find the usual /lib64 layout and system libraries.
#
# The version and hash come from nix/release.json; nix/update.sh refreshes them from the
# latest GitHub release (the hash is the sha512 that electron-builder publishes in
# latest-linux.yml, so nothing is downloaded to compute it).
{
  lib,
  appimageTools,
  fetchurl,
  makeDesktopItem,
}:

let
  release = lib.importJSON ./release.json;
  pname = "arffornia-launcher";
  inherit (release) version;

  src = fetchurl {
    inherit (release) url hash;
    name = "arffornia-launcher-${version}.AppImage";
  };

  contents = appimageTools.extractType2 { inherit pname version src; };

  desktopItem = makeDesktopItem {
    name = pname;
    desktopName = "Arffornia Launcher";
    genericName = "Minecraft launcher";
    comment = "Play on the Arffornia modded Minecraft server";
    extraConfig = {
      "Comment[fr]" = "Jouer sur le serveur Minecraft moddé Arffornia";
      "GenericName[fr]" = "Lanceur Minecraft";
    };
    exec = "${pname} %U";
    icon = pname;
    categories = [ "Game" ];
    keywords = [ "minecraft" "arffornia" "launcher" ];
    startupWMClass = "Arffornia Launcher";
  };
in
appimageTools.wrapType2 {
  inherit pname version src;

  # Libraries for the game itself (the JRE and LWJGL natives are downloaded by the launcher).
  extraPkgs =
    pkgs: with pkgs; [
      libGL
      glfw
      openal
      libpulseaudio
      alsa-lib
      flite # in-game narrator
      udev
      libx11
      libxext
      libxcursor
      libxrandr
      libxxf86vm
      libxi
      libxkbcommon
      wayland
    ];

  # The launcher keeps its data in the working directory until
  # https://github.com/Arffornia/Arffornia_Launcher_V.5.2/issues/42 moves it to the user data
  # folder. Start from $HOME so `nix run` from any folder uses the same ~/.Arffornia_V.5.2 as
  # a desktop launch.
  extraBwrapArgs = [ "--chdir" "\"$HOME\"" ];

  extraInstallCommands = ''
    install -Dm444 ${desktopItem}/share/applications/${pname}.desktop \
      $out/share/applications/${pname}.desktop
    # electron-builder ships one 520x520 icon; 512x512 is the closest standard hicolor size.
    install -Dm444 "${contents}/Arffornia Launcher.png" \
      $out/share/icons/hicolor/512x512/apps/${pname}.png
  '';

  meta = {
    description = "Launcher for the Arffornia modded Minecraft server";
    homepage = "https://github.com/Arffornia/Arffornia_Launcher_V.5.2";
    license = lib.licenses.mit;
    platforms = [ "x86_64-linux" ];
    mainProgram = pname;
    sourceProvenance = [ lib.sourceTypes.binaryNativeCode ];
  };
}
