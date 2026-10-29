// Mocked responses for every remote endpoint the renderer calls. No real network in E2E.

const zlib = require('zlib')

/** Solid-colour RGBA PNG of the given size (64x64 is a valid Minecraft skin for the 3D viewer). */
function makePng(size) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc32 = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 4, 0x80)])
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const PNG = makePng(64)

const shopItem = (id, name) => ({
  id,
  name,
  real_price: 100 + id,
  promo_price: 50 + id,
  img_url: `https://arffornia.com/images/shop/${id}.png`
})

const players = [
  { name: 'PlayerOne', vote_count: 30, progress_point: 300, grade: 1 },
  { name: 'PlayerTwo', vote_count: 20, progress_point: 200, grade: 1 },
  { name: 'PlayerThree', vote_count: 10, progress_point: 100, grade: 1 }
]

/** [RegExp on the URL, response] — first match wins. */
const routes = [
  [/arffornia\.com\/api\/shop\/newest\//, { json: [shopItem(1, 'Newest Item')] }],
  [/arffornia\.com\/api\/shop\/sales\//, { json: [shopItem(2, 'Sale Item')] }],
  [/arffornia\.com\/api\/shop\/bestSallers\//, { json: [shopItem(3, 'Best Seller Item')] }],
  [/arffornia\.com\/api\/best_player_vote\//, { json: players }],
  [/arffornia\.com\/api\/best_player_point\//, { json: players }],
  [/arffornia\.com\/api\/launcherImages/, { json: [{ path: 'https://arffornia.com/images/launcher/1.png' }] }],
  [/arffornia\.com\/api\/profile\//, { json: { name: 'PlayerOne', progress_point: 0, day_streak: 0 } }],
  [
    /api\.mcstatus\.io\//,
    { json: { online: true, players: { online: 3, max: 100 }, version: { name_clean: '1.21.1' } } }
  ],
  [/featuredShaders\.json/, { json: { featured: [] } }],
  [/api\.modrinth\.com\/v2\/search/, { json: { hits: [], total_hits: 0, offset: 0, limit: 20 } }],
  [/api\.modrinth\.com\/v2\//, { json: [] }],
  [/\.(png|jpe?g|webp|gif)(\?|$)|minotar\.net|mineskin\.eu/, { png: true }]
]

/**
 * Install the mocks on a Playwright Page (or BrowserContext). Unknown remote requests are aborted
 * and recorded so a test can assert none happened.
 * @param {import('@playwright/test').Page | import('@playwright/test').BrowserContext} target
 * @returns {Promise<string[]>} live list of unexpected remote URLs
 */
async function mockRemoteEndpoints(target) {
  const unexpected = []
  await target.route(/^https?:\/\//, async (route) => {
    const url = route.request().url()
    const match = routes.find(([re]) => re.test(url))
    if (!match) {
      if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) unexpected.push(url)
      return route.abort()
    }
    const [, res] = match
    if (res.png) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG, headers: cors })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(res.json), headers: cors })
  })
  return unexpected
}

const cors = { 'access-control-allow-origin': '*' }

module.exports = { mockRemoteEndpoints }
