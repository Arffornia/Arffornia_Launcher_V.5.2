import fs from 'fs'
import path from 'path'

// servers.dat is uncompressed NBT. The pack ships one with the production server; for a beta
// environment the launcher rewrites it after the mod sync, so the in-game list cannot send a
// staging client to production by mistake.

const END = 0
const COMPOUND = 10
const LIST = 9
const STRING = 8

const FIXED_SIZE = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 4, 6: 8 }

function readTag(buf, type, at) {
  if (FIXED_SIZE[type]) return { value: buf.subarray(at.pos, (at.pos += FIXED_SIZE[type])), type }
  switch (type) {
    case 7: case 11: case 12: {
      const len = buf.readInt32BE(at.pos)
      const width = type === 7 ? 1 : type === 11 ? 4 : 8
      const start = at.pos
      at.pos += 4 + len * width
      return { value: buf.subarray(start, at.pos), type, raw: true }
    }
    case STRING: {
      const len = buf.readUInt16BE(at.pos)
      const value = buf.toString('utf8', at.pos + 2, at.pos + 2 + len)
      at.pos += 2 + len
      return { value, type }
    }
    case LIST: {
      const itemType = buf.readUInt8(at.pos)
      const len = buf.readInt32BE(at.pos + 1)
      at.pos += 5
      const items = []
      for (let i = 0; i < len; i++) items.push(readTag(buf, itemType, at))
      return { value: items, type, itemType }
    }
    case COMPOUND: {
      const entries = []
      for (;;) {
        const t = buf.readUInt8(at.pos++)
        if (t === END) break
        const nameLen = buf.readUInt16BE(at.pos)
        const name = buf.toString('utf8', at.pos + 2, at.pos + 2 + nameLen)
        at.pos += 2 + nameLen
        entries.push([name, readTag(buf, t, at)])
      }
      return { value: entries, type }
    }
    default:
      throw new Error(`Unsupported NBT tag ${type}`)
  }
}

function writeTag(tag, out) {
  const { type, value } = tag
  if (FIXED_SIZE[type] || tag.raw) return out.push(Buffer.from(value))
  switch (type) {
    case STRING: {
      const bytes = Buffer.from(value, 'utf8')
      const len = Buffer.alloc(2)
      len.writeUInt16BE(bytes.length)
      return out.push(len, bytes)
    }
    case LIST: {
      const head = Buffer.alloc(5)
      head.writeUInt8(value.length ? tag.itemType : END)
      head.writeInt32BE(value.length, 1)
      out.push(head)
      return value.forEach((item) => writeTag(item, out))
    }
    case COMPOUND: {
      for (const [name, child] of value) {
        const nameBytes = Buffer.from(name, 'utf8')
        const head = Buffer.alloc(3)
        head.writeUInt8(child.type)
        head.writeUInt16BE(nameBytes.length, 1)
        out.push(head, nameBytes)
        writeTag(child, out)
      }
      return out.push(Buffer.from([END]))
    }
    default:
      throw new Error(`Unsupported NBT tag ${type}`)
  }
}

export function parseNbt(buf) {
  const at = { pos: 0 }
  const type = buf.readUInt8(at.pos++)
  if (type !== COMPOUND) throw new Error('servers.dat does not start with a compound')
  at.pos += 2 + buf.readUInt16BE(at.pos)
  return readTag(buf, COMPOUND, at)
}

export function serializeNbt(root) {
  const out = [Buffer.from([COMPOUND, 0, 0])]
  writeTag(root, out)
  return Buffer.concat(out)
}

const str = (value) => ({ type: STRING, value })

const NAMES = { staging: 'Arffornia · Staging', slot: 'Arffornia · Test' }

/**
 * Point every server of the list at `address`, named `name`, keeping the pack's icon. A list
 * without any server gets one entry.
 */
export function retargetServerList(root, { name, address }) {
  let servers = root.value.find(([key]) => key === 'servers')?.[1]
  if (!servers) {
    servers = { type: LIST, itemType: COMPOUND, value: [] }
    root.value.push(['servers', servers])
  }
  const first = servers.value[0] ?? { type: COMPOUND, value: [] }
  const entries = first.value.filter(([key]) => key !== 'ip' && key !== 'name')
  entries.push(['ip', str(address)], ['name', str(name)])
  servers.itemType = COMPOUND
  servers.value = [{ type: COMPOUND, value: entries }]
  return root
}

export function applyEnvironmentServerList(gameDir, environment, logger = console) {
  if (environment.id === 'production') return false
  const file = path.join(gameDir, 'servers.dat')
  let root = { type: COMPOUND, value: [] }
  try {
    root = parseNbt(fs.readFileSync(file))
  } catch (error) {
    if (error.code !== 'ENOENT') logger.warn(`servers.dat unreadable (${error.message}); writing a new one.`)
  }
  retargetServerList(root, { name: NAMES[environment.id] ?? `Arffornia · ${environment.id}`, address: environment.server })
  fs.writeFileSync(file, serializeNbt(root))
  logger.info(`Server list set to ${environment.server} for the ${environment.id} environment.`)
  return true
}
