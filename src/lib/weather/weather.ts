import type { WeatherSettings } from '../../types'
import { nowIso } from '../id'
import { fetchHko, fetchOpenMeteo, type WeatherNow } from './providers'
import type { WarningSnapshot } from './warnings'

const CACHE_KEY = 'pwd:weather'
const TTL = 30 * 60_000

interface WeatherCache {
  fetchedAt: string
  key: string
  data: WeatherNow
}

function cacheKeyOf(w: WeatherSettings): string {
  return w.source === 'hko'
    ? `hko:${w.hkoStation}`
    : `om:${w.location?.latitude},${w.location?.longitude}`
}

function readCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as WeatherCache) : null
  } catch {
    return null
  }
}

function writeCache(cache: WeatherCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // cache is best-effort
  }
}

export function isWeatherStale(w: WeatherSettings): boolean {
  const cached = readCache()
  if (!cached || cached.key !== cacheKeyOf(w)) return true
  return Date.now() - Date.parse(cached.fetchedAt) >= TTL
}

/** Cached fetch: 30-min TTL per source/station/city; a stale value beats an error. */
export async function getWeather(w: WeatherSettings, opts?: { force?: boolean }): Promise<WeatherNow> {
  const key = cacheKeyOf(w)
  const cached = readCache()
  const fresh = cached && cached.key === key && Date.now() - Date.parse(cached.fetchedAt) < TTL
  if (!opts?.force && fresh) return cached.data
  try {
    const data = w.source === 'hko' ? await fetchHko(w.hkoStation) : await fetchOpenMeteo(w.location)
    writeCache({ fetchedAt: nowIso(), key, data })
    return data
  } catch (e) {
    if (cached && cached.key === key) return cached.data
    throw e
  }
}

// ---- HKO warnings ----

const WARNINGS_KEY = 'pwd:hko-warnings'
/** Last-poll cache is for first paint only. A signal can stand for hours, but
 *  a day-old one is misleading, so anything older is treated as unknown. The
 *  live poll overwrites it within a second of the app opening either way. */
const WARNINGS_MAX_AGE = 3 * 60 * 60_000

export function readWarnings(): WarningSnapshot | null {
  try {
    const raw = localStorage.getItem(WARNINGS_KEY)
    if (!raw) return null
    const snap = JSON.parse(raw) as WarningSnapshot
    if (!Array.isArray(snap?.warnings) || !Array.isArray(snap?.tips)) return null
    return Date.now() - Date.parse(snap.fetchedAt) < WARNINGS_MAX_AGE ? snap : null
  } catch {
    return null
  }
}

export function writeWarnings(snap: WarningSnapshot): void {
  try {
    localStorage.setItem(WARNINGS_KEY, JSON.stringify(snap))
  } catch {
    // cache is best-effort
  }
}
