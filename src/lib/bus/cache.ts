import { get, set } from 'idb-keyval'

/**
 * Daily cache for the operators' STATIC data — route lists and the stop names
 * on a route. IndexedDB rather than localStorage, and deliberately outside
 * the zustand store: this is the operators' data, not the user's, so it must
 * never reach a backup envelope and must never count against the ~5 MB
 * localStorage budget the rest of the app shares.
 *
 * KMB's own guidance is that static data changes once a day, after 05:00.
 */

const DAY = 24 * 60 * 60_000

interface Entry<T> {
  fetchedAt: number
  data: T
}

async function readEntry<T>(key: string): Promise<Entry<T> | undefined> {
  try {
    return await get<Entry<T>>(key)
  } catch {
    return undefined
  }
}

async function writeEntry<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, { fetchedAt: Date.now(), data } satisfies Entry<T>)
  } catch {
    // Cache is best-effort; a full or blocked IndexedDB just means we refetch.
  }
}

/**
 * Cached loader. A stale entry beats an error — the same policy getWeather
 * uses — because a day-old route list still lets someone find their stop on
 * a train with no signal.
 */
export async function cachedDaily<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = await readEntry<T>(key)
  if (hit && Date.now() - hit.fetchedAt < DAY) return hit.data
  try {
    const data = await load()
    await writeEntry(key, data)
    return data
  } catch (e) {
    if (hit) return hit.data
    throw e
  }
}
