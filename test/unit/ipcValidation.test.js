import { describe, expect, it } from 'vitest'
import {
  assertActiveShaderName,
  assertShaderDownloadUrl,
  assertShaderFileName,
  assertShaderMetadata,
  isAllowedExternalUrl,
  isSafeFileName,
  isTrustedSenderUrl
} from '../../src/main/ipcValidation'

describe('isSafeFileName', () => {
  it.each(['BSL_v8.4.zip', 'Complementary Reimagined r5.5.zip', 'shader-pack (1).zip', 'MakeUp'])(
    'accepts %s',
    (name) => expect(isSafeFileName(name)).toBe(true)
  )

  it.each([
    '',
    '.',
    '..',
    '../x.zip',
    '../../x',
    'a/b.zip',
    'a\\b.zip',
    '..\\..\\evil.zip',
    '/etc/passwd',
    'C:\\Windows\\x.zip',
    'C:x.zip',
    'x.zip\u0000.txt',
    'line\nbreak.zip',
    ' leading.zip',
    'a'.repeat(256),
    null,
    undefined,
    42,
    {},
    ['x.zip']
  ])('rejects %j', (name) => expect(isSafeFileName(name)).toBe(false))
})

describe('assertShaderFileName', () => {
  it('requires .zip when asked', () => {
    expect(assertShaderFileName('a.zip', { requireZip: true })).toBe('a.zip')
    expect(assertShaderFileName('a.ZIP', { requireZip: true })).toBe('a.ZIP')
    expect(() => assertShaderFileName('a.jar', { requireZip: true })).toThrow()
  })

  it('throws on traversal', () => {
    expect(() => assertShaderFileName('../../launcherOptions.json')).toThrow('Invalid shader file name')
  })
})

describe('assertActiveShaderName', () => {
  it('accepts the off values', () => {
    expect(assertActiveShaderName('OFF')).toBe('OFF')
    expect(assertActiveShaderName('')).toBe('')
    expect(assertActiveShaderName(null)).toBe(null)
    expect(assertActiveShaderName(undefined)).toBe(null)
  })

  it('validates file names', () => {
    expect(assertActiveShaderName('BSL.zip')).toBe('BSL.zip')
    expect(() => assertActiveShaderName('../x')).toThrow()
    expect(() => assertActiveShaderName('x\nshaderPack=y')).toThrow()
  })
})

describe('assertShaderDownloadUrl', () => {
  it('accepts Modrinth CDN https URLs', () => {
    const url = 'https://cdn.modrinth.com/data/Q1vvjJYV/versions/abc/BSL_v8.4.zip'
    expect(assertShaderDownloadUrl(url)).toBe(url)
  })

  it.each([
    'http://cdn.modrinth.com/data/x.zip',
    'https://cdn.modrinth.com.evil.example/x.zip',
    'https://evil.example/cdn.modrinth.com/x.zip',
    'https://user:pass@cdn.modrinth.com/x.zip',
    'https://cdn.modrinth.com:8443/x.zip',
    'file:///etc/passwd',
    'not a url',
    '',
    null,
    123
  ])('rejects %j', (url) => expect(() => assertShaderDownloadUrl(url)).toThrow())
})

describe('isAllowedExternalUrl', () => {
  it.each([
    'https://arffornia.com',
    'https://arffornia.com/shop/12',
    'https://discord.gg/CWH6w67',
    'https://modrinth.com/shader/bsl-shaders'
  ])('allows %s', (url) => expect(isAllowedExternalUrl(url)).toBe(true))

  it.each([
    'http://arffornia.com',
    'file:///etc/passwd',
    'file:///C:/Windows/System32/calc.exe',
    'smb://attacker/share',
    'javascript:alert(1)',
    'ms-settings:',
    'https://arffornia.com.evil.example',
    'https://evil.example/?arffornia.com',
    'https://user@arffornia.com',
    'https://arffornia.com:8080/',
    '',
    null,
    undefined,
    {}
  ])('refuses %j', (url) => expect(isAllowedExternalUrl(url)).toBe(false))
})

describe('assertShaderMetadata', () => {
  it('accepts plain objects', () => {
    expect(assertShaderMetadata({ title: 'BSL' })).toEqual({ title: 'BSL' })
  })

  it.each([null, 'x', 1, ['a']])('rejects %j', (m) => expect(() => assertShaderMetadata(m)).toThrow())

  it('rejects oversized metadata', () => {
    expect(() => assertShaderMetadata({ blob: 'x'.repeat(300 * 1024) })).toThrow('too large')
  })
})

describe('isTrustedSenderUrl', () => {
  it('trusts the packaged renderer (file://)', () => {
    expect(isTrustedSenderUrl('file:///opt/Arffornia/resources/app.asar/out/renderer/index.html')).toBe(true)
  })

  it('trusts the dev server only in dev', () => {
    const opts = { isDev: true, devServerUrl: 'http://localhost:5173' }
    expect(isTrustedSenderUrl('http://localhost:5173/#/settings', opts)).toBe(true)
    expect(isTrustedSenderUrl('http://localhost:5174/', opts)).toBe(false)
    expect(isTrustedSenderUrl('http://localhost:5173/', { devServerUrl: 'http://localhost:5173' })).toBe(false)
  })

  it.each(['https://evil.example', 'https://login.live.com/oauth20_authorize.srf', '', null, undefined])(
    'rejects %j',
    (url) => expect(isTrustedSenderUrl(url)).toBe(false)
  )
})
