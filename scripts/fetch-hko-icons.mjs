// Downloads the official HKO warning icons into public/hko/.
// Run: node scripts/fetch-hko-icons.mjs
//
// Bundled rather than hotlinked so the chip renders offline and behind the
// work proxy, and so a slow HKO image server cannot stall the status bar.
// ~33 KB for all 21. The names come from HKO's own dailywx image directory;
// WARNING_ICONS in src/lib/weather/warnings.ts maps warning codes onto them.
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = 'https://www.hko.gov.hk/en/wxinfo/dailywx/images'
const OUT = 'public/hko'

const NAMES = [
  'tc1',
  'tc3',
  'tc8ne',
  'tc8se',
  'tc8nw',
  'tc8sw',
  'tc9',
  'tc10',
  'raina',
  'rainr',
  'rainb',
  'ts',
  'landslip',
  'vhot',
  'cold',
  'sms',
  'frost',
  'tsunami-warn',
  'firey',
  'firer',
  'ntfl',
]

mkdirSync(OUT, { recursive: true })

let total = 0
for (const name of NAMES) {
  const url = `${BASE}/${name}.gif`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.subarray(0, 3).toString('ascii') !== 'GIF') throw new Error(`${url} is not a GIF`)
  writeFileSync(`${OUT}/${name}.gif`, buf)
  total += buf.length
  console.log(`${name}.gif  ${buf.length} B`)
}
console.log(`\n${NAMES.length} icons, ${(total / 1024).toFixed(1)} KB -> ${OUT}/`)
