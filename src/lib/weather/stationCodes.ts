/** Short codes for common HKO temperature stations, keyed by the exact
 *  display name the rhrread feed uses (the feed exposes no station ids). */
export const HKO_STATION_CODES: Record<string, string> = {
  'Hong Kong Observatory': 'HKO',
  'Hong Kong Park': 'HKP',
  'Chek Lap Kok': 'CLK',
  'Cheung Chau': 'CC',
  'Happy Valley': 'HV',
  'Kai Tak Runway Park': 'KT',
  "King's Park": 'KP',
  'Kowloon City': 'KC',
  'Kwun Tong': 'KTG',
  'Sai Kung': 'SK',
  'Sha Tin': 'ST',
  'Sham Shui Po': 'SSP',
  'Shau Kei Wan': 'SKW',
  'Ta Kwu Ling': 'TKL',
  'Tai Mei Tuk': 'TMT',
  'Tai Po': 'TP',
  'The Peak': 'PEAK',
  'Tseung Kwan O': 'TKO',
  'Tsing Yi': 'TY',
  'Tsuen Wan Ho Koon': 'TWHK',
  'Tsuen Wan Shing Mun Valley': 'TWSM',
  'Tuen Mun': 'TM',
  'Wong Chuk Hang': 'WCH',
  'Yuen Long Park': 'YLP',
}

/** "Tseung Kwan O" → "TKO"; single words take their first three letters. */
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** Chip label in 'code' style — curated code, else derived initials
 *  (which also covers Open-Meteo city names). */
export function shortLabel(name: string): string {
  return HKO_STATION_CODES[name] ?? deriveInitials(name)
}
