import { useEffect, useState } from 'react'
import { Field, inputCls } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import type { WeatherLocation, WeatherSource } from '../../types'
import { geocodeCity, listHkoStations } from '../../lib/weather/providers'
import { useAppStore } from '../../store/appStore'

export function WeatherSection() {
  const weather = useAppStore((s) => s.settings.weather)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [stations, setStations] = useState<string[] | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WeatherLocation[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

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
          </div>
          {weather.source === 'hko' ? (
            <Field label="Station">
              <select
                className={inputCls}
                value={weather.hkoStation}
                onChange={(e) => updateSettings({ weather: { hkoStation: e.target.value } })}
              >
                {(stations ?? [weather.hkoStation]).map((s) => (
                  <option key={s} value={s}>
                    {s}
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
    </div>
  )
}
