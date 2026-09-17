import { useEffect, useState } from 'react'
import { Field, inputCls } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import type { WeatherLocation, WeatherSettings, WeatherSource } from '../../types'
import { geocodeCity, listHkoStations } from '../../lib/weather/providers'
import { playChime, primeChime } from '../../lib/weather/chime'
import { stationNameTc } from '../../lib/weather/stationCodes'
import { warningSettings } from '../../lib/weather/warnings'
import { useAppStore } from '../../store/appStore'

type Permission = NotificationPermission | 'unsupported'

function notificationPermission(): Permission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

export function WeatherSection() {
  const weather = useAppStore((s) => s.settings.weather)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [stations, setStations] = useState<string[] | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WeatherLocation[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const warn = warningSettings(weather)
  const [permission, setPermission] = useState<Permission>(notificationPermission)

  const patchWarnings = (patch: Partial<typeof warn>) =>
    // updateSettings deep-merges only one level, so `warnings` is replaced
    // wholesale — spread the resolved values or the siblings are lost.
    updateSettings({ weather: { warnings: { ...warn, ...patch } } })

  useEffect(() => {
    if (weather.enabled && weather.source === 'hko') {
      listHkoStations()
        .then(setStations)
        .catch(() => setStations(null))
    }
  }, [weather.enabled, weather.source])

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setError('')
    try {
      const found = await geocodeCity(q)
      setResults(found)
      if (found.length === 0) setError('No city found with that name.')
    } catch {
      setError('City search failed — network blocked or offline.')
    } finally {
      setSearching(false)
    }
  }

  const pick = (loc: WeatherLocation) => {
    updateSettings({ weather: { location: loc } })
    setResults(null)
    setQuery('')
  }

  const locLabel = (l: WeatherLocation) =>
    [l.name, l.admin1, l.country].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={weather.enabled}
          onChange={(e) => updateSettings({ weather: { enabled: e.target.checked } })}
          className="h-4 w-4 accent-indigo-600"
        />
        <span>Show weather in the status bar</span>
      </label>
      {weather.enabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select
                className={inputCls}
                value={weather.source}
                onChange={(e) =>
                  updateSettings({ weather: { source: e.target.value as WeatherSource } })
                }
              >
                <option value="hko">Hong Kong Observatory</option>
                <option value="open-meteo">Open-Meteo (any city)</option>
              </select>
            </Field>
            <Field label="Unit">
              <select
                className={inputCls}
                value={weather.unit}
                onChange={(e) =>
                  updateSettings({
                    weather: { unit: e.target.value as 'celsius' | 'fahrenheit' },
                  })
                }
              >
                <option value="celsius">°C</option>
                <option value="fahrenheit">°F</option>
              </select>
            </Field>
            <Field label="Chip label">
              <select
                className={inputCls}
                value={weather.labelStyle ?? 'tc'}
                onChange={(e) =>
                  updateSettings({
                    weather: { labelStyle: e.target.value as WeatherSettings['labelStyle'] },
                  })
                }
              >
                <option value="tc">中文</option>
                <option value="name">Full name</option>
                <option value="code">Short code</option>
              </select>
            </Field>
          </div>
          {weather.source === 'hko' ? (
            <Field label="Station">
              <select
                className={inputCls}
                value={weather.hkoStation}
                onChange={(e) => updateSettings({ weather: { hkoStation: e.target.value } })}
              >
                {/* The value stays the English name — it is the key the feed
                    and stationCodes.ts are both indexed by. Only the label
                    follows the chip setting. */}
                {(stations ?? [weather.hkoStation]).map((s) => (
                  <option key={s} value={s}>
                    {weather.labelStyle === 'name' || weather.labelStyle === 'code'
                      ? s
                      : stationNameTc(s)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current city:{' '}
                {weather.location ? locLabel(weather.location) : 'none — search below'}
              </p>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  void search()
                }}
              >
                <input
                  className={inputCls}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search city…"
                />
                <Button variant="primary" type="submit" disabled={searching || !query.trim()}>
                  {searching ? '…' : 'Search'}
                </Button>
              </form>
              {results && results.length > 0 && (
                <div className="flex flex-col gap-1">
                  {results.map((r) => (
                    <button
                      key={`${r.latitude},${r.longitude}`}
                      type="button"
                      onClick={() => pick(r)}
                      className="rounded-md border border-slate-200 px-2.5 py-1.5 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
                    >
                      {locLabel(r)}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}
        </>
      )}

      <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={warn.enabled}
            onChange={(e) => patchWarnings({ enabled: e.target.checked })}
            className="h-4 w-4 accent-indigo-600"
          />
          <span>Alert me when a Hong Kong Observatory warning changes</span>
        </label>
        {warn.enabled && (
          <div className="mt-2 flex flex-col gap-2 pl-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={warn.sound}
                onChange={(e) => {
                  // Inside the click, so the AudioContext starts unlocked — a
                  // chime fired later by the poll timer cannot unlock itself.
                  if (e.target.checked) {
                    primeChime()
                    playChime()
                  }
                  patchWarnings({ sound: e.target.checked })
                }}
                className="h-4 w-4 accent-indigo-600"
              />
              <span>Play a sound</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={warn.notify}
                onChange={(e) => {
                  patchWarnings({ notify: e.target.checked })
                  // Browsers only accept this from a user gesture.
                  if (e.target.checked && notificationPermission() === 'default') {
                    void Notification.requestPermission().then(setPermission)
                  }
                }}
                className="h-4 w-4 accent-indigo-600"
              />
              <span>Also raise a desktop notification</span>
            </label>
            {warn.notify && permission !== 'granted' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {permission === 'denied'
                  ? 'Notifications are blocked for this site — allow them in the browser’s site settings.'
                  : permission === 'unsupported'
                    ? 'This browser has no notification support; the in-app alert still appears.'
                    : 'Permission not granted yet — the in-app alert still appears.'}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Checked every minute while WorkDesk is open, including in a background tab. Alerts
              fire only when the hoisted set actually changes — never on a repeat check, and never
              for a signal that was already up when you opened the app.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
