# Libraries for the game itself, shared by the stable package and the beta runner (the JRE and
# the LWJGL natives are downloaded by the launcher at run time).
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
]
