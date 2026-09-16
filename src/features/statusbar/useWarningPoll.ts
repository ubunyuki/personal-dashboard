import { useEffect, useRef } from 'react'
import { fetchWarnings } from '../../lib/weather/providers'
import { playChime } from '../../lib/weather/chime'
import { readWarnings, writeWarnings } from '../../lib/weather/weather'
import {
  backoffDelay,
  describeDiff,
  diffWarnings,
  jitter,
  warningSettings,
  type Warning,
  type WarningDiff,
} from '../../lib/weather/warnings'
import { useAppStore } from '../../store/appStore'
import { useWarningStore } from '../../store/warningStore'

const BASE_TITLE = 'WorkDesk'
const FLASH_MS = 1_400
/** Floor between a visibility-triggered refetch and the last attempt, so
 *  alt-tabbing through windows cannot turn into a burst of requests. */
const MIN_GAP_MS = 20_000

/**
 * The HKO warning poll. Mounted once from App — never from the chip, which
 * unmounts whenever nothing is hoisted and would take the poll with it.
 *
 * Deliberately keeps running while the tab is hidden: a pinned background tab
 * is the whole point of this feature, and the title flash exists for exactly
 * that case. Chrome throttles hidden-tab timers to one tick a minute anyway,
 * so 60s is the practical floor regardless of what we ask for — asking for
 * less would only add requests while the tab is already in front.
 *
 * Independent of `weather.enabled`: someone who hides the temperature chip
 * still wants to know a No. 8 has gone up.
 */
export function useWarningPoll(): void {
  const weather = useAppStore((s) => s.settings.weather)
  const { enabled, notify, sound } = warningSettings(weather)

  // Outside the effect so a settings toggle — which re-runs it — cannot reset
  // the baseline and re-announce a signal the user was already told about.
  const seen = useRef<Warning[] | null>(null)
  // Read through refs for the same reason: the poll body must not be rebuilt
  // just because the sound checkbox moved.
  const notifyRef = useRef(notify)
  const soundRef = useRef(sound)
  useEffect(() => {
    notifyRef.current = notify
    soundRef.current = sound
  }, [notify, sound])

  useEffect(() => {
    if (!enabled) {
      seen.current = null
      useWarningStore.getState().reset()
      return
    }
    // Paint from the last poll before the network answers.
    const cached = readWarnings()
    if (cached) useWarningStore.getState().setSnapshot(cached)

    let alive = true
    let timer = 0
    let failures = 0
    let lastAttempt = 0

    const announce = (diff: WarningDiff, at: string) => {
      const title = diff.added.length > 0 ? 'Weather warning' : 'Weather warning cancelled'
      const body = describeDiff(diff)
      useWarningStore.getState().raiseAlert(title, body, at)
      if (soundRef.current) playChime()
      // An OS notification only where permission is already granted: this code
      // path is a timer, so it must never call requestPermission itself.
      if (notifyRef.current && typeof Notification !== 'undefined') {
        try {
          if (Notification.permission === 'granted') new Notification(title, { body })
        } catch {
          // Some browsers throw on the constructor outside a service worker.
        }
      }
    }

    const poll = async () => {
      lastAttempt = Date.now()
      try {
        const snap = await fetchWarnings()
        if (!alive) return
        failures = 0
        writeWarnings(snap)
        useWarningStore.getState().setSnapshot(snap)
        const diff = diffWarnings(seen.current, snap.warnings)
        seen.current = snap.warnings
        if (diff.changed) announce(diff, snap.fetchedAt)
      } catch {
        if (!alive) return
        failures += 1
        useWarningStore.getState().setError(true)
      } finally {
        if (alive) {
          window.clearTimeout(timer)
          timer = window.setTimeout(() => void poll(), backoffDelay(failures) + jitter())
        }
      }
    }

    // Correct for timer drift, and for however long a suspended laptop was shut.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastAttempt > MIN_GAP_MS) {
        void poll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    void poll()

    return () => {
      alive = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])

  // Title flash, for the background tab the poll exists to serve. Flips only
  // while hidden; the title is restored the moment the tab is looked at.
  const alertId = useWarningStore((s) => s.alert?.id ?? 0)
  const alertTitle = useWarningStore((s) => s.alert?.title ?? '')
  useEffect(() => {
    if (alertId === 0) return
    let on = false
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') return
      on = !on
      document.title = on ? `⚠ ${alertTitle}` : BASE_TITLE
    }, FLASH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        on = false
        document.title = BASE_TITLE
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      document.title = BASE_TITLE
    }
  }, [alertId, alertTitle])
}
