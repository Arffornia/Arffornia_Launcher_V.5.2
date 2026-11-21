import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({ responses: new Map(), requested: [] }))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async (url) => {
      m.requested.push(url)
      if (!m.responses.has(url)) throw new Error('HTTP 404')
      return { data: m.responses.get(url) }
    })
  }
}))
vi.mock('@arffornia/nexus_mods', () => ({
  ModFile: class {
    constructor(path, hash, hashType, url) {
      Object.assign(this, { path, hash, hashType, url })
    }
  },
  getHashTypeFromStr: (s) => s
}))

const { lockUrlFor, splitModList, loadModsWithLock } = await import('../../src/main/modLock')

const SHA1 = 'a'.repeat(40)
const entry = (name, extra = {}) => ({
  path: `mods/${name}`,
  url: `https://edge.forgecdn.net/files/1/2/${name}`,
  hashType: 'sha1',
  hash: SHA1,
  size: 1,
  ...extra
})
const modList = () => ({
  mods: {
    curseforge: [
      { displayName: 'AE2', projectId: 1, fileId: 2 },
      { displayName: 'New', projectId: 3, fileId: 4 }
    ],
    modrinth: [{ displayName: 'CC', versionId: 'v1' }],
    'github-releases': [
      {
        displayName: 'Arffornia',
        owner: 'Arffornia',
        repoName: 'Arffornia_Mods',
        tag: 'latest',
        assetName: 'arffornia.jar'
      }
    ]
  }
})
const lock = (files) => ({ schema: 1, files })

describe('lockUrlFor', () => {
  it('puts the lock next to the mod list', () => {
    expect(lockUrlFor('https://staging.arffornia.com/pack/config/launcher/modList.json')).toBe(
      'https://staging.arffornia.com/pack/config/launcher/modList.lock.json'
    )
  })
})

describe('splitModList', () => {
  it('leaves only entries missing from the lock for the live lookup', () => {
    const { locked, remaining } = splitModList(
      modList(),
      lock({ 'curseforge:1:2': entry('ae2.jar'), 'modrinth:v1': entry('cc.jar') })
    )

    expect([locked.length, remaining.mods.curseforge.map((m) => m.displayName)]).toEqual([
      2,
      ['New']
    ])
  })

  it('always resolves GitHub releases live', () => {
    const { remaining } = splitModList(modList(), lock({}))

    expect(remaining.mods['github-releases']).toHaveLength(1)
  })

  it('ignores a lock with another schema', () => {
    const { locked } = splitModList(modList(), {
      schema: 2,
      files: { 'curseforge:1:2': entry('ae2.jar') }
    })

    expect(locked).toHaveLength(0)
  })

  it.each([
    ['a path outside mods/', { path: '../evil.jar' }],
    ['a nested path', { path: 'mods/a/b.jar' }],
    ['a dot-dot file name', { path: 'mods/..' }],
    ['a plain http URL', { url: 'http://edge.forgecdn.net/x.jar' }],
    ['an unknown hash type', { hashType: 'sha256' }],
    ['a hash of the wrong length', { hash: 'abc' }]
  ])('treats an entry with %s as missing', (_name, extra) => {
    const { locked } = splitModList(modList(), lock({ 'curseforge:1:2': entry('ae2.jar', extra) }))

    expect(locked).toHaveLength(0)
  })
})

describe('loadModsWithLock', () => {
  const URL_LIST = 'https://example.test/config/launcher/modList.json'
  const URL_LOCK = 'https://example.test/config/launcher/modList.lock.json'
  const logger = { info: vi.fn(), warn: vi.fn() }
  let nexus

  beforeEach(() => {
    m.responses.clear()
    m.requested.length = 0
    nexus = {
      added: [],
      addModFile: vi.fn((f) => nexus.added.push(f)),
      loadModsFromJson: vi.fn(),
      loadModsFromJsonUrl: vi.fn()
    }
  })

  it('registers locked mods and sends only the rest to the live lookup', async () => {
    m.responses.set(URL_LIST, JSON.stringify(modList()))
    m.responses.set(
      URL_LOCK,
      JSON.stringify(lock({ 'curseforge:1:2': entry('ae2.jar'), 'modrinth:v1': entry('cc.jar') }))
    )

    await loadModsWithLock(nexus, URL_LIST, logger)

    const sent = JSON.parse(nexus.loadModsFromJson.mock.calls[0][0])
    expect([nexus.added.length, sent.mods.curseforge.length, sent.mods.modrinth.length]).toEqual([
      2, 1, 0
    ])
  })

  it('resolves everything online when the lock is missing', async () => {
    m.responses.set(URL_LIST, JSON.stringify(modList()))

    await loadModsWithLock(nexus, URL_LIST, logger)

    expect(JSON.parse(nexus.loadModsFromJson.mock.calls[0][0])).toEqual(modList())
  })

  it('falls back to the Nexus_Mods loader when the mod list cannot be read', async () => {
    await loadModsWithLock(nexus, URL_LIST, logger)

    expect(nexus.loadModsFromJsonUrl).toHaveBeenCalledWith(URL_LIST)
  })
})
