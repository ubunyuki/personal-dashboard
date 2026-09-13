// Generates the PWA icons (2×2 dashboard-grid motif matching favicon.svg).
// Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

// ---- minimal PNG encoder (8-bit RGBA, filter 0, no interlace) ----
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- artwork ----
const INDIGO = [79, 70, 229]
const WHITE = [255, 255, 255]
const AMBER = [245, 158, 11]
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const SOFT_WHITE = mix(INDIGO, WHITE, 0.82)

function insideRoundedRect(px, py, x, y, w, h, r) {
  const cx = x + w / 2
  const cy = y + h / 2
  const dx = Math.max(Math.abs(px - cx) - (w / 2 - r), 0)
  const dy = Math.max(Math.abs(py - cy) - (h / 2 - r), 0)
  return dx * dx + dy * dy <= r * r
}

function makeSampler(size, { maskable }) {
  // Maskable icons must keep content inside the central safe zone.
  const scale = maskable ? 0.56 : 0.66
  const C = size * scale
  const o = (size - C) / 2
  const t = C * 0.44
  const gap = C * 0.12
  const tr = t * 0.25
  const tiles = [
    { x: o, y: o, color: WHITE },
    { x: o + t + gap, y: o, color: SOFT_WHITE },
    { x: o, y: o + t + gap, color: SOFT_WHITE },
    { x: o + t + gap, y: o + t + gap, color: AMBER },
  ]
  const bgRadius = size * 0.22
  return (px, py) => {
    if (!maskable && !insideRoundedRect(px, py, 0, 0, size, size, bgRadius)) return null
    for (const tile of tiles) {
      if (insideRoundedRect(px, py, tile.x, tile.y, t, t, tr)) return tile.color
    }
    return INDIGO
  }
}

function render(size, opts) {
  const sample = makeSampler(size, opts)
  const offsets = [0.25, 0.75] // 2×2 supersampling for smooth edges
  return encodePng(size, (x, y) => {
    let r = 0
    let g = 0
    let b = 0
    let covered = 0
    for (const oy of offsets) {
      for (const ox of offsets) {
        const c = sample(x + ox, y + oy)
        if (c) {
          r += c[0]
          g += c[1]
          b += c[2]
          covered++
        }
      }
    }
    if (covered === 0) return [0, 0, 0, 0]
    return [
      Math.round(r / covered),
      Math.round(g / covered),
      Math.round(b / covered),
      Math.round((covered / 4) * 255),
    ]
  })
}

writeFileSync('public/pwa-192.png', render(192, { maskable: false }))
writeFileSync('public/pwa-512.png', render(512, { maskable: false }))
writeFileSync('public/maskable-512.png', render(512, { maskable: true }))
console.log('icons written to public/')
