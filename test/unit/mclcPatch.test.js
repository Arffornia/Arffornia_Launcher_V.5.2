import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const Handler = require('minecraft-launcher-core/components/handler')

const sha1 = (text) => crypto.createHash('sha1').update(text).digest('hex')

let root
let handler
let downloads

function makeHandler(overrides = {}) {
  const client = { emit: vi.fn(), options: {} }
  client.options = {
    root,
    overrides: {
      assetRoot: path.join(root, 'assets'),
      url: { resource: 'https://res' },
      ...overrides
    },
    version: { number: '1.21.1' }
  }
  const instance = new Handler(client)
  downloads = []
  instance.downloadAsync = vi.fn(async (url, directory, name) => {
    downloads.push(name)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, name), contents[name])
    return { failed: false, asset: null }
  })
  return instance
}

let contents

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-mclc-'))
  contents = {}
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('library verification', () => {
  const library = (jarSha1) => ({
    name: 'org.example:lib:1.0',
    downloads: {
      artifact: { path: 'org/example/lib/1.0/lib-1.0.jar', sha1: jarSha1, url: 'https://x/lib.jar' }
    }
  })

  it('re-downloads a library jar whose hash does not match', async () => {
    contents['lib-1.0.jar'] = 'good'
    handler = makeHandler()
    const jarDir = path.join(root, 'libraries', 'org/example/lib/1.0')
    fs.mkdirSync(jarDir, { recursive: true })
    fs.writeFileSync(path.join(jarDir, 'lib-1.0.jar'), 'truncated')

    await handler.downloadToDirectory(
      path.join(root, 'libraries'),
      [library(sha1('good'))],
      'classes'
    )

    expect(downloads).toEqual(['lib-1.0.jar'])
  })

  it('keeps a library jar whose hash matches', async () => {
    handler = makeHandler()
    const jarDir = path.join(root, 'libraries', 'org/example/lib/1.0')
    fs.mkdirSync(jarDir, { recursive: true })
    fs.writeFileSync(path.join(jarDir, 'lib-1.0.jar'), 'good')

    await handler.downloadToDirectory(
      path.join(root, 'libraries'),
      [library(sha1('good'))],
      'classes'
    )

    expect(downloads).toEqual([])
  })
})

describe('asset verification', () => {
  const assetsDir = () => path.join(root, 'assets')
  const objectPath = (hash) => path.join(assetsDir(), 'objects', hash.slice(0, 2), hash)

  function seedIndex(files) {
    const objects = {}
    for (const [name, body] of Object.entries(files)) {
      objects[name] = { hash: sha1(body), size: body.length }
      contents[sha1(body)] = body
    }
    fs.mkdirSync(path.join(assetsDir(), 'indexes'), { recursive: true })
    fs.writeFileSync(path.join(assetsDir(), 'indexes', '1.21.1.json'), JSON.stringify({ objects }))
    return objects
  }

  function placeObject(body, onDisk = body) {
    const hash = sha1(body)
    fs.mkdirSync(path.dirname(objectPath(hash)), { recursive: true })
    fs.writeFileSync(objectPath(hash), onDisk)
  }

  async function run(overrides) {
    handler = makeHandler(overrides)
    handler.version = { assetIndex: { url: 'unused' } }
    await handler.getAssets()
  }

  it('re-downloads a corrupt asset on the first launch', async () => {
    seedIndex({ 'a.png': 'aaa' })
    placeObject('aaa', 'corrupted')

    await run()

    expect(downloads).toEqual([sha1('aaa')])
  })

  it('skips hashing on the next launch once the files were verified', async () => {
    seedIndex({ 'a.png': 'aaa' })
    placeObject('aaa')
    await run()
    const hashSpy = vi.spyOn(Handler.prototype, 'checkSum')

    await run()

    expect(hashSpy).not.toHaveBeenCalled()
  })

  it('still downloads an asset that went missing after verification', async () => {
    seedIndex({ 'a.png': 'aaa' })
    placeObject('aaa')
    await run()
    fs.rmSync(objectPath(sha1('aaa')))

    await run()

    expect(downloads).toEqual([sha1('aaa')])
  })

  it('hashes everything again when the index changes', async () => {
    seedIndex({ 'a.png': 'aaa' })
    placeObject('aaa')
    await run()
    seedIndex({ 'a.png': 'aaa', 'b.png': 'bbb' })
    placeObject('bbb', 'corrupted')

    await run()

    expect(downloads).toEqual([sha1('bbb')])
  })

  it('repairs a corrupt asset when a full verification is requested', async () => {
    seedIndex({ 'a.png': 'aaa' })
    placeObject('aaa')
    await run()
    fs.writeFileSync(objectPath(sha1('aaa')), 'corrupted')

    await run({ verifyAssets: true })

    expect(downloads).toEqual([sha1('aaa')])
  })

  it('does not write the verified stamp when a download failed', async () => {
    seedIndex({ 'a.png': 'aaa' })
    handler = makeHandler()
    handler.version = { assetIndex: { url: 'unused' } }
    handler.downloadAsync = vi.fn(async () => false)

    await handler.getAssets()

    expect(fs.existsSync(path.join(assetsDir(), 'indexes', '1.21.1.verified.json'))).toBe(false)
  })
})
