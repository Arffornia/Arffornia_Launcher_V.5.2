#!/usr/bin/env node
// Guard: players must keep getting the newest stable launcher.
//
// The prod launcher updates from GitHub `releases/latest` (electron-updater, GitHub provider,
// no prerelease). This script checks, after every publish, that `releases/latest`:
//   - exists, is not a draft and not a pre-release,
//   - has a stable tag (vX.Y.Z, no "-suffix"),
//   - is the newest stable release of the repository,
//   - carries the update files the prod launcher reads (latest.yml, latest-linux.yml).
// It exits 1 with a reason on the first problem, so the workflow fails and opens an issue.
//
// Usage: node tools/check-stable-latest.mjs [owner/repo]   (GITHUB_TOKEN is used when set)

const STABLE_TAG = /^v(\d+)\.(\d+)\.(\d+)$/
const UPDATE_FILES = ['latest.yml', 'latest-linux.yml']

/** @returns {number[] | null} [major, minor, patch] for a stable tag, null otherwise */
export function parseStableTag(tag) {
  const m = STABLE_TAG.exec(String(tag))
  return m ? m.slice(1).map(Number) : null
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

/**
 * Pure check, unit tested.
 * @param {{tag_name: string, draft?: boolean, prerelease?: boolean, assets?: {name: string}[]} | null} latest
 *   the body of GET /repos/{repo}/releases/latest (null on 404)
 * @param {{tag_name: string, draft?: boolean, prerelease?: boolean}[]} releases all releases
 * @returns {{ok: true, tag: string} | {ok: false, reason: string}}
 */
export function checkLatestIsStable(latest, releases) {
  if (!latest) return { ok: false, reason: 'releases/latest returns nothing' }
  const tag = latest.tag_name
  if (latest.draft) return { ok: false, reason: `releases/latest (${tag}) is a draft` }
  if (latest.prerelease) return { ok: false, reason: `releases/latest (${tag}) is a pre-release` }
  const version = parseStableTag(tag)
  if (!version) return { ok: false, reason: `releases/latest has a non-stable tag "${tag}"` }

  const newer = releases
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => ({ tag: r.tag_name, v: parseStableTag(r.tag_name) }))
    .filter((r) => r.v && compare(r.v, version) > 0)
  if (newer.length > 0) {
    return {
      ok: false,
      reason: `releases/latest is ${tag} but a newer stable release exists: ${newer.map((r) => r.tag).join(', ')}`
    }
  }

  const names = new Set((latest.assets || []).map((a) => a.name))
  const missing = UPDATE_FILES.filter((f) => !names.has(f))
  if (missing.length > 0) {
    return { ok: false, reason: `releases/latest (${tag}) has no ${missing.join(', ')}` }
  }
  return { ok: true, tag }
}

async function api(path) {
  const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' }
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`)
  return res.json()
}

async function main() {
  const repo = process.argv[2] || process.env.GITHUB_REPOSITORY || 'Arffornia/Arffornia_Launcher_V.5.2'
  const latest = await api(`/repos/${repo}/releases/latest`)
  const releases = []
  for (let page = 1; page <= 10; page++) {
    const batch = await api(`/repos/${repo}/releases?per_page=100&page=${page}`)
    if (!batch || batch.length === 0) break
    releases.push(...batch)
  }
  const result = checkLatestIsStable(latest, releases)
  if (!result.ok) {
    console.error(`::error::Players may not get the stable launcher: ${result.reason}`)
    process.exit(1)
  }
  console.log(`OK: releases/latest is the newest stable release, ${result.tag}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`::error::${e.message}`)
    process.exit(1)
  })
}
