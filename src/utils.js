import { ArchType, OsType } from '@arffornia/nexus_java';
import os from 'os';


export function getArchType()  {
  const arch = os.arch();
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

console.log("Archi type:", getArchType());
console.log("Os Type:", getOsType());
