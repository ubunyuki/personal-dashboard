import type { WeatherSettings } from '../../types'
import { nowIso } from '../id'
import { fetchHko, fetchOpenMeteo, type WeatherNow } from './providers'

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
