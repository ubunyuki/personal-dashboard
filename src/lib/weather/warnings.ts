/**
 * HKO weather warnings — the pure half. No fetch, no DOM, no storage.
 *
 * `warnsum` is `{}` when nothing is hoisted, and otherwise a map keyed by
 * warning STATEMENT code (WTCSGNL, WRAIN, WTS, WL, WHOT, WCOLD, WMSGNL,
 * WFIRE, WFROST, WFNTSA, WTMW), each value carrying the finer-grained
 * `code` (TC8NE, WRAINB, …) that the icons and severity key off.
 *
 * Two things matter here:
 *
 * 1. Every parser is defensive. This is untrusted JSON from a service nobody
 *    here controls; a shape change must degrade to "no warnings", never throw.
 * 2. `diffWarnings` is polled once a minute. It must fire ONLY on a genuine
 *    transition, never on the ~1,439 daily ticks that return identical data,
 *    or an actual typhoon becomes a notification storm.
 */

import type { WarningSettings, WeatherSettings } from '../../types'

/**
 * Resolve the always-optional warning settings to concrete values. Read sites
 * call this instead of repeating `?? true` — the fields are nested, so old
 * persisted data has none of them. Warnings are on by default; the chip is
 * the only surface that appears unasked, and it appears only when a signal is
 * actually up.
 */
export function warningSettings(w: WeatherSettings): Required<WarningSettings> {
  const s = w.warnings
  return { enabled: s?.enabled ?? true, notify: s?.notify ?? true, sound: s?.sound ?? true }
}

/** One hoisted warning, normalised from a warnsum entry. */
export interface Warning {
  /** Statement code, e.g. 'WTCSGNL'. */
  statement: string
  /** Warning code, e.g. 'TC8NE' or 'WRAINB'. This is what the icon keys off. */
  code: string
  /** HKO's own name, e.g. 'Tropical Cyclone Warning Signal'. */
  name: string
  /** Severity word — only WFIRE / WRAIN / WTCSGNL carry one, e.g. 'Black'. */
  type?: string
  actionCode?: string
  issueTime?: string
  updateTime?: string
}

/** A Special Weather Tip — HKO's pre-announcement, issued BEFORE a signal. */
export interface WeatherTip {
  desc: string
  updateTime?: string
}

/** One poll's worth of state, as cached and as rendered. */
export interface WarningSnapshot {
  warnings: Warning[]
  tips: WeatherTip[]
  fetchedAt: string
}

/**
 * Warning code → bundled icon under public/hko/. Keyed on `code`, not on the
 * statement code: one statement (WRAIN) has three severities that must show
 * three different icons. Files come from scripts/fetch-hko-icons.mjs.
 */
export const WARNING_ICONS: Readonly<Record<string, string>> = Object.freeze({
  TC1: 'tc1',
  TC3: 'tc3',
  TC8NE: 'tc8ne',
  TC8SE: 'tc8se',
  TC8NW: 'tc8nw',
  TC8SW: 'tc8sw',
  TC9: 'tc9',
  TC10: 'tc10',
  WRAINA: 'raina',
  WRAINR: 'rainr',
  WRAINB: 'rainb',
  WTS: 'ts',
  WL: 'landslip',
  WHOT: 'vhot',
  WCOLD: 'cold',
  WMSGNL: 'sms',
  WFROST: 'frost',
  WTMW: 'tsunami-warn',
  WFIREY: 'firey',
  WFIRER: 'firer',
  WFNTSA: 'ntfl',
})

/** Icon URL, or undefined for a code HKO has added since the last icon fetch. */
export function iconFor(w: Warning): string | undefined {
  const file = WARNING_ICONS[w.code]
  return file ? `${import.meta.env.BASE_URL}hko/${file}.gif` : undefined
}

/**
 * Rough severity, used only to order the chip so the worst signal sits first.
 * HKO publishes no ranking across warning types, so this is a judgement call,
 * not an official scale.
 */
const SEVERITY: Readonly<Record<string, number>> = Object.freeze({
  TC10: 100,
  TC9: 90,
  TC8NE: 80,
  TC8SE: 80,
  TC8NW: 80,
  TC8SW: 80,
  WTMW: 75,
  WRAINB: 70,
  TC3: 60,
  WRAINR: 55,
  WRAINA: 40,
  TC1: 35,
  WMSGNL: 30,
  WL: 30,
  WTS: 25,
  WFNTSA: 25,
  WFIRER: 20,
  WHOT: 15,
  WCOLD: 15,
  WFIREY: 10,
  WFROST: 10,
})

export function severityOf(w: Warning): number {
  return SEVERITY[w.code] ?? 0
}

/** Human label for the chip, the panel and the notification. */
export function labelFor(w: Warning): string {
  // `type` carries the severity word for the three warnings that have one
  // ('Black', 'Strong Wind Signal No. 3'), which reads better than the code.
  return w.type ? `${w.name} — ${w.type}` : w.name
}

/**
 * Normalise a raw warnsum body into a severity-ordered list. Anything
 * malformed is dropped rather than thrown — see the module note.
 */
export function parseWarnsum(raw: unknown): Warning[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return []
  const out: Warning[] = []
  for (const [statement, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    const code = typeof v.code === 'string' ? v.code : null
    if (!code) continue
    // CANCEL is the withdrawal of a signal, not a signal — it lingers in the
    // feed for a while after, and must not render as if still hoisted.
    if (code === 'CANCEL' || v.actionCode === 'CANCEL') continue
    out.push({
      statement,
      code,
      name: typeof v.name === 'string' ? v.name : statement,
      type: typeof v.type === 'string' ? v.type : undefined,
      actionCode: typeof v.actionCode === 'string' ? v.actionCode : undefined,
      issueTime: typeof v.issueTime === 'string' ? v.issueTime : undefined,
      updateTime: typeof v.updateTime === 'string' ? v.updateTime : undefined,
    })
  }
  return out.sort((a, b) => severityOf(b) - severityOf(a) || a.code.localeCompare(b.code))
}

/** `{"swt":[]}` when quiet, `{swt:[{updateTime, desc}]}` otherwise. */
export function parseSwt(raw: unknown): WeatherTip[] {
  const list = (raw as { swt?: unknown } | null)?.swt
  if (!Array.isArray(list)) return []
  return list.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const v = item as Record<string, unknown>
    if (typeof v.desc !== 'string' || v.desc.trim() === '') return []
    return [
      { desc: v.desc.trim(), updateTime: typeof v.updateTime === 'string' ? v.updateTime : undefined },
    ]
  })
}

/**
 * Detail paragraphs from a warningInfo body, keyed by statement code. Note
 * warningInfo also emits WTCPRE8 (the pre-no.8 announcement), which never
 * appears in warnsum — so a key here may have no matching Warning.
 */
export function parseWarningInfo(raw: unknown): Record<string, string[]> {
  const details = (raw as { details?: unknown } | null)?.details
  if (!Array.isArray(details)) return {}
  const out: Record<string, string[]> = {}
  for (const d of details) {
    if (typeof d !== 'object' || d === null) continue
    const v = d as Record<string, unknown>
    const key = typeof v.warningStatementCode === 'string' ? v.warningStatementCode : null
    if (!key || !Array.isArray(v.contents)) continue
    const lines = v.contents.filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    if (lines.length > 0) out[key] = lines
  }
  return out
}

/**
 * The identity a poll compares against. `code` alone is not enough: a
 * thunderstorm warning that is EXTENDed keeps its code but is new
 * information, and a No. 8 that swings NE → SW is a change the user must see.
 */
export function signatureOf(w: Warning): string {
  return `${w.statement}:${w.code}:${w.actionCode ?? ''}`
}

export interface WarningDiff {
  /** Newly hoisted, or the same statement at a different code/action. */
  added: Warning[]
  /** No longer hoisted. */
  removed: Warning[]
  /** True when anything at all changed — the only reason to notify. */
  changed: boolean
}

const NO_CHANGE: WarningDiff = { added: [], removed: [], changed: false }

/**
 * Compare two polls. `prev === null` means "no poll yet this session", which
 * is deliberately NOT a change: a signal already hoisted when the app opens
 * must not fire a notification, or every launch during a typhoon alarms the
 * user about something they already know.
 */
export function diffWarnings(prev: Warning[] | null, next: Warning[]): WarningDiff {
  if (prev === null) return NO_CHANGE
  const prevSigs = new Set(prev.map(signatureOf))
  const nextSigs = new Set(next.map(signatureOf))
  const added = next.filter((w) => !prevSigs.has(signatureOf(w)))
  const removed = prev.filter((w) => !nextSigs.has(signatureOf(w)))
  if (added.length === 0 && removed.length === 0) return NO_CHANGE
  return { added, removed, changed: true }
}

/** One line summarising a change, for the toast and the Notification body. */
export function describeDiff(diff: WarningDiff): string {
  const parts: string[] = []
  if (diff.added.length > 0) parts.push(diff.added.map(labelFor).join(', '))
  if (diff.removed.length > 0) parts.push(`Cancelled: ${diff.removed.map(labelFor).join(', ')}`)
  return parts.join(' · ')
}

/**
 * Poll delay by consecutive-failure count: 1m normally, then 2m and 5m, then
 * held at 5m. An HKO outage must not turn into 1,440 failed requests a day.
 * The first success resets the count to 0 — see `useWarningPoll`.
 */
const BACKOFF_MS = [60_000, 120_000, 300_000] as const

export const POLL_MS = BACKOFF_MS[0]

export function backoffDelay(failures: number): number {
  return BACKOFF_MS[Math.min(Math.max(failures, 0), BACKOFF_MS.length - 1)]
}

/** 0–5s of spread so a pinned tab's requests never align on an exact minute. */
export function jitter(random: number = Math.random()): number {
  return Math.floor(random * 5_000)
}
