import { describe, expect, it } from 'vitest';
import path from 'path';
import { ArchType } from '@arffornia/nexus_java';
import { resolveDataDir, MACOS_DATA_ROOT } from '../../src/main/dataDir';
import { getArchType } from '../../src/main/utils';

describe('resolveDataDir', () => {
  it('keeps the historical relative path on Windows and Linux', () => {
    expect(resolveDataDir('./.Arffornia_V.5.2', 'win32')).toBe('./.Arffornia_V.5.2');
    expect(resolveDataDir('./java', 'linux')).toBe('./java');
  });

  it('uses an absolute, writable directory on macOS (Finder starts apps with cwd "/")', () => {
    const dir = resolveDataDir('./.Arffornia_V.5.2', 'darwin', '/Users/me/Library/Application Support/Arffornia');
    expect(dir).toBe('/Users/me/Library/Application Support/Arffornia/.Arffornia_V.5.2');
    expect(path.isAbsolute(dir)).toBe(true);
  });

  it('defaults to ~/Library/Application Support/Arffornia on macOS', () => {
    expect(MACOS_DATA_ROOT.endsWith(path.join('Library', 'Application Support', 'Arffornia'))).toBe(true);
    expect(resolveDataDir('./java', 'darwin')).toBe(path.join(MACOS_DATA_ROOT, 'java'));
  });
});

describe('getArchType', () => {
  it('maps Node arch names to Azul arch names', () => {
    expect(getArchType('x64', 'linux', false)).toBe(ArchType.X64);
    expect(getArchType('arm64', 'linux', false)).toBe(ArchType.AARCH64);
    expect(getArchType('arm64', 'darwin', false)).toBe(ArchType.AARCH64);
  });

  it('asks for an arm64 Java when an x64 build runs under Rosetta on Apple Silicon', () => {
    expect(getArchType('x64', 'darwin', true)).toBe(ArchType.AARCH64);
    expect(getArchType('x64', 'darwin', false)).toBe(ArchType.X64);
  });
});
