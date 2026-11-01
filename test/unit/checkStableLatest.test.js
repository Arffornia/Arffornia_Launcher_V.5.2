import { describe, expect, it } from 'vitest'
import { checkLatestIsStable, parseStableTag } from '../../tools/check-stable-latest.mjs'

const assets = [{ name: 'latest.yml' }, { name: 'latest-linux.yml' }, { name: 'latest-mac.yml' }]
const stable = (tag, extra = {}) => ({ tag_name: tag, draft: false, prerelease: false, assets, ...extra })

describe('parseStableTag', () => {
  it('accepts vX.Y.Z only', () => {
    expect(parseStableTag('v0.1.15')).toEqual([0, 1, 15])
    expect(parseStableTag('v0.1.16-beta.3')).toBeNull()
    expect(parseStableTag('beta')).toBeNull()
    expect(parseStableTag('0.1.15')).toBeNull()
  })
})

describe('checkLatestIsStable', () => {
  const beta = { tag_name: 'beta', draft: false, prerelease: true }

  it('passes when latest is the newest stable release, whatever the pre-releases', () => {
    const releases = [beta, stable('v0.1.15'), stable('v0.1.9'), { tag_name: 'v0.2.0-beta.1', prerelease: true }]
    expect(checkLatestIsStable(stable('v0.1.15'), releases)).toEqual({ ok: true, tag: 'v0.1.15' })
  })

  it('compares versions numerically, not as strings', () => {
    expect(checkLatestIsStable(stable('v0.1.15'), [stable('v0.1.9'), stable('v0.1.15')]).ok).toBe(true)
    expect(checkLatestIsStable(stable('v0.1.9'), [stable('v0.1.9'), stable('v0.1.15')]).ok).toBe(false)
  })

  it('fails when latest is a pre-release or has a pre-release tag', () => {
    expect(checkLatestIsStable({ ...beta, assets }, [beta]).ok).toBe(false)
    const r = checkLatestIsStable(stable('v0.1.16-beta.2'), [])
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/non-stable tag/)
  })

  it('fails when latest is missing, a draft, or has no update files', () => {
    expect(checkLatestIsStable(null, []).ok).toBe(false)
    expect(checkLatestIsStable(stable('v0.1.15', { draft: true }), []).ok).toBe(false)
    const r = checkLatestIsStable(stable('v0.1.15', { assets: [{ name: 'latest.yml' }] }), [])
    expect(r).toEqual({ ok: false, reason: 'releases/latest (v0.1.15) has no latest-linux.yml' })
  })
})
