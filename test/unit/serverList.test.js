import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyEnvironmentServerList,
  parseNbt,
  retargetServerList,
  serializeNbt
} from '../../src/main/serverList'

const PACK_SERVERS_DAT = path.resolve(__dirname, '../fixtures/servers.dat')

function servers(root) {
  return root.value
    .find(([k]) => k === 'servers')[1]
    .value.map((s) => Object.fromEntries(s.value.map(([k, t]) => [k, t.value])))
}

const silent = { info() {}, warn() {} }
let dir

afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }))

describe('servers.dat', () => {
  it('round-trips the pack file byte for byte', () => {
    const bytes = fs.readFileSync(PACK_SERVERS_DAT)

    expect(serializeNbt(parseNbt(bytes)).equals(bytes)).toBe(true)
  })

  it('points the list at the environment server and keeps the icon', () => {
    const root = parseNbt(fs.readFileSync(PACK_SERVERS_DAT))

    const [server] = servers(
      parseNbt(
        serializeNbt(
          retargetServerList(root, {
            name: 'Arffornia · Test',
            address: 'test.arffornia.com:25566'
          })
        )
      )
    )

    expect({
      ip: server.ip,
      name: server.name,
      hasIcon: typeof server.icon === 'string' && server.icon.length > 100
    }).toEqual({ ip: 'test.arffornia.com:25566', name: 'Arffornia · Test', hasIcon: true })
  })

  it('writes a list for the slot environment even without a pack file', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servers-dat-'))

    applyEnvironmentServerList(dir, { id: 'slot', server: 'test.arffornia.com:25566' }, silent)

    expect(servers(parseNbt(fs.readFileSync(path.join(dir, 'servers.dat'))))).toEqual([
      { ip: 'test.arffornia.com:25566', name: 'Arffornia · Test' }
    ])
  })

  it('leaves production alone', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'servers-dat-'))

    applyEnvironmentServerList(dir, { id: 'production', server: 'arffornia.com:25565' }, silent)

    expect(fs.existsSync(path.join(dir, 'servers.dat'))).toBe(false)
  })
})
