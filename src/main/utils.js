import { ArchType, OsType } from '@arffornia/nexus_java';
import os from 'os';
import { app } from 'electron';


// `translated`: true when an x64 build runs under Rosetta 2 on Apple Silicon. os.arch() then
// reports "x64", but a native arm64 Java runs the game much faster, so ask for aarch64.
export function getArchType(arch = os.arch(), platform = os.platform(), translated = app?.runningUnderARM64Translation)  {
  if (platform === 'darwin' && arch === 'x64' && translated) {
      return ArchType.AARCH64;
  }
  switch (arch) {
      case "x64":
          return ArchType.X64;
      case "ia32":
          return ArchType.X86;
      case "arm":
          return ArchType.ARM;
      case "arm64":
          return ArchType.AARCH64;
      default:
          return undefined;
  }
}


export function getOsType() {
  const platform = os.platform();
  switch (platform) {
      case "win32":
          return OsType.WINDOWS;
      case "darwin":
          return OsType.MACOS;
      case "linux":
          return OsType.LINUX;
      case "sunos":
          return OsType.SOLARIS;
      default:
          return undefined;
  }
}

// logger.info("Archi type: ", getArchType());
// logger.info("Os Type: ", getOsType());
