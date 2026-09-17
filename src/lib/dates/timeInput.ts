/**
 * Typed time entry, so the app stops depending on what `<input type="time">`
 * decides to render on a given device. The native control picks 12- or 24-hour
 * from the OS locale, which is why the same task read 2:30 PM on one machine
 * and 14:30 on another; a text box parsed here looks the same everywhere.
 *
 * Deliberately forgiving about how a time is typed and strict about what comes
 * out: always canonical 24-hour 'HH:mm', the format the rest of the app stores
 * and date-fns formats.
 */

/** Shown under the field so the accepted shapes are not a guessing game. */
export const TIME_INPUT_HINT = '24-hour — e.g. 1430, 14:30, or 2:30pm'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * '1430' | '14:30' | '14.30' | '14h30' | '930' | '9' | '2:30pm' → 'HH:mm'.
 * Returns null for anything that is not a real time, so callers can reject
 * rather than store nonsense. Idempotent: parsing 'HH:mm' returns it unchanged,
 * which lets a form normalise again at submit time without special-casing.
 */
export function parseTimeInput(raw: string): string | null {
  const s = raw.toLowerCase().replace(/\s/g, '')
  if (!s) return null
  // Strip a trailing meridiem first; what remains is pure digits + separator.
  const mer = /(a|p)\.?m\.?$/.exec(s)
  const body = mer ? s.slice(0, mer.index) : s
  const m = /^(\d{1,2})[:.h]?(\d{2})?$/.exec(body)
  if (!m) return null
  let hours = Number(m[1])
  const minutes = m[2] === undefined ? 0 : Number(m[2])
  if (minutes > 59) return null
  if (mer) {
    // 12-hour clock: 12am is midnight and 12pm is noon, so the hour wraps
    // before the 12 is added rather than after.
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (mer[1] === 'p' ? 12 : 0)
  } else if (hours > 23) return null
  return `${pad(hours)}:${pad(minutes)}`
}
