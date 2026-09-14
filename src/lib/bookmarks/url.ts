/** Trim and default the scheme so "example.com" becomes a real URL.
 *  Returns '' for blank input; existing schemes are left alone. */
export function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s
  return `https://${s}`
}

/** Hostname for favicon/display, or null when the URL cannot be parsed. */
export function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname || null
  } catch {
    return null
  }
}
