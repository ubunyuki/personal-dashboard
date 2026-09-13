/** Ask the browser to protect this origin's storage from eviction.
 *  Chromium never prompts — it grants based on heuristics (installed PWA,
 *  engagement). Safe to call on every boot. */
export async function requestPersist(): Promise<boolean> {
  try {
    if (!('storage' in navigator) || !navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
