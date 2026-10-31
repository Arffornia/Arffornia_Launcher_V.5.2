import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const http = vi.hoisted(() => ({ files: {}, calls: [], failChecksum: false, cutAfter: null }))

vi.mock('../../src/main/index.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))
vi.mock('axios', () => ({
  default: vi.fn(async ({ url, responseType }) => {
    http.calls.push(url)
    if (url.endsWith('.sha256') && http.failChecksum) throw new Error('getaddrinfo ENOTFOUND')
    const body = http.files[url]
    if (body === undefined) throw new Error(`404 ${url}`)
    if (responseType === 'stream') {
      if (http.cutAfter !== null) {
        const stream = new Readable({ read() {} })
        stream.push(body.subarray(0, http.cutAfter))
        setImmediate(() => stream.destroy(new Error('ECONNRESET')))
        return { data: stream }
      }
      return { data: Readable.from([body]) }
    }
    return { data: body.toString() }
  })
}))

const { downloadNeoforge, getInstallerUrl, isBeforeVersion, parseSha256File } = await import(
  '../../src/main/neoforgeDownloader'
)

const VERSION = '21.1.172'
const URL = 'https://maven.neoforged.net/releases/net/neoforged/neoforge/21.1.172/neoforge-21.1.172-installer.jar'
const JAR = Buffer.from('PK\u0003\u0004 fake neoforge installer')
const SHA = crypto.createHash('sha256').update(JAR).digest('hex')

let dir
const installerPath = () => path.join(dir, 'neoforgeInstaller', `forge-${VERSION}-installer.jar`)

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-neoforge-'))
  http.files = { [URL]: JAR, [`${URL}.sha256`]: Buffer.from(SHA) }
  http.calls = []
  http.failChecksum = false
  http.cutAfter = null
})

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('helpers', () => {
  it.each([
    ['1.20.1', '1.20.2', true],
    ['1.20.2', '1.20.2', false],
    ['21.1.172', '1.20.2', false],
    ['1.19', '1.20.2', true],
    ['1.20.2.1', '1.20.2', false]
  ])('isBeforeVersion(%s, %s) = %s', (a, b, expected) => expect(isBeforeVersion(a, b)).toBe(expected))

  it('builds forge and neoforge URLs', () => {
    expect(getInstallerUrl(VERSION)).toBe(URL)
    expect(getInstallerUrl('1.20.1-47.1.0')).toContain('/net/neoforged/forge/1.20.1-47.1.0/forge-1.20.1-47.1.0-installer.jar')
  })

  it('parses .sha256 files', () => {
    expect(parseSha256File(SHA)).toBe(SHA)
    expect(parseSha256File(`${SHA.toUpperCase()}  neoforge.jar\n`)).toBe(SHA)
    expect(parseSha256File('<html>not found</html>')).toBe(null)
    expect(parseSha256File(undefined)).toBe(null)
  })
})

describe('downloadNeoforge', () => {
  it('downloads and verifies the installer', async () => {
    const result = await downloadNeoforge(dir, VERSION)
    expect(result).toBe(installerPath())
    expect(fs.readFileSync(result)).toEqual(JAR)
    expect(fs.existsSync(`${result}.part`)).toBe(false)
  })

  it('reuses a verified existing file without downloading', async () => {
    await downloadNeoforge(dir, VERSION)
    http.calls = []
    await downloadNeoforge(dir, VERSION)
    expect(http.calls).toEqual([`${URL}.sha256`])
  })

  it('replaces a corrupt or partial existing file', async () => {
    fs.mkdirSync(path.dirname(installerPath()), { recursive: true })
    fs.writeFileSync(installerPath(), JAR.subarray(0, 5))
    await downloadNeoforge(dir, VERSION)
    expect(fs.readFileSync(installerPath())).toEqual(JAR)
  })

  it('throws on checksum mismatch and keeps nothing', async () => {
    http.files[URL] = Buffer.from('tampered')
    await expect(downloadNeoforge(dir, VERSION)).rejects.toThrow(/checksum mismatch/)
    expect(fs.existsSync(installerPath())).toBe(false)
    expect(fs.existsSync(`${installerPath()}.part`)).toBe(false)
  })

  it('does not keep an interrupted download', async () => {
    http.cutAfter = 4
    await expect(downloadNeoforge(dir, VERSION)).rejects.toThrow()
    expect(fs.existsSync(installerPath())).toBe(false)
    expect(fs.existsSync(`${installerPath()}.part`)).toBe(false)
  })

  it('works offline with an existing file, fails offline without one', async () => {
    http.failChecksum = true
    await expect(downloadNeoforge(dir, VERSION)).rejects.toThrow(/checksum/)
    http.failChecksum = false
    await downloadNeoforge(dir, VERSION)
    http.failChecksum = true
    await expect(downloadNeoforge(dir, VERSION)).resolves.toBe(installerPath())
  })

  it('reports progress steps', async () => {
    const steps = []
    await downloadNeoforge(dir, VERSION, false, (s) => steps.push(s))
    expect(steps).toEqual(['CHECKING', 'DOWNLOADING'])
  })
})
