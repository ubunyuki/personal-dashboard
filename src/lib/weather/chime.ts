/**
 * A short two-note chime for weather-warning alerts.
 *
 * Synthesised rather than shipped as a file: no asset, no decode, and nothing
 * for the PWA cache to miss. The AudioContext is created lazily and must be
 * primed from a user gesture — a chime fired later by the 60s poll cannot
 * unlock audio by itself, so `primeChime()` runs from the Settings toggle.
 */

type AudioCtor = typeof AudioContext

let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

/** Create/resume the context from inside a user gesture. Safe to call often. */
export function primeChime(): void {
  void context()?.resume()
}

/** A5 then D6, ~0.5s total. Silently does nothing where audio is unavailable. */
export function playChime(): void {
  const ac = context()
  if (!ac) return
  void ac.resume()
  const start = ac.currentTime + 0.02
  for (const [i, freq] of [880, 1174.66].entries()) {
    const at = start + i * 0.22
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    // Ramped rather than switched: a bare start/stop on a gain of 1 clicks.
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)
    osc.connect(gain).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 0.32)
  }
}
