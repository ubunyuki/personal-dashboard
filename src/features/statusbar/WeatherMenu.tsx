import { useEffect, useState } from 'react'
import { Check, Settings } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { inputCls } from '../../components/ui/Field'
import type { WeatherLocation } from '../../types'
import { geocodeCity, listHkoStations } from '../../lib/weather/providers'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

/** Anchored dropdown under the weather chip's place name: pick another HKO
 *  station (or search a city for Open-Meteo) without opening full Settings. */
export function WeatherMenu() {
  const weather = useAppStore((s) => s.settings.weather)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const closeWeatherMenu = useUiStore((s) => s.closeWeatherMenu)
  const openSettings = useUiStore((s) => s.openSettings)

  const [stations, setStations] = useState<string[] | null>(null)
  const [stationsError, setStationsError] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WeatherLocation[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const hko = weather.source === 'hko'

  useEffect(() => {
    if (!hko) return
    listHkoStations()
      .then(setStations)
      .catch(() => setStationsError(true))
  }, [hko])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWeatherMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeWeatherMenu])

  const pickStation = (s: string) => {
    updateSettings({ weather: { hkoStation: s } })
    closeWeatherMenu()
  }

  const pickCity = (loc: WeatherLocation) => {
    updateSettings({ weather: { location: loc } })
    closeWeatherMenu()
  }

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    try {
      const found = await geocodeCity(q)
      setResults(found)
      if (found.length === 0) setSearchError('No city found with that name.')
    } catch {
      setSearchError('City search failed — network blocked or offline.')
    } finally {
      setSearching(false)
    }
  }

  const locLabel = (l: WeatherLocation) => [l.name, l.admin1, l.country].filter(Boolean).join(', ')

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={closeWeatherMenu} />
      <div className="absolute top-9 right-0 z-40 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {hko ? (
          <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
            {stationsError ? (
              <p className="px-2 py-2 text-sm text-slate-400 dark:text-slate-500">
                Station list unavailable — network blocked or offline.
              </p>
            ) : stations == null ? (
              <p className="px-2 py-2 text-sm text-slate-400 dark:text-slate-500">
                Loading stations…
              </p>
            ) : (
              stations.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickStation(s)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="min-w-0 flex-1 truncate">{s}</span>
                  {s === weather.hkoStation && (
                    <Check size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current city: {weather.location ? locLabel(weather.location) : 'none — search below'}
            </p>
            <form
              className="flex items-center gap-1.5"
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
                autoFocus
              />
              <Button variant="primary" type="submit" disabled={searching || !query.trim()}>
                {searching ? '…' : 'Go'}
              </Button>
            </form>
            {results && results.length > 0 && (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={`${r.latitude},${r.longitude}`}
                    type="button"
                    onClick={() => pickCity(r)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
                  >
                    {locLabel(r)}
                  </button>
                ))}
              </div>
            )}
            {searchError && <p className="text-xs text-red-600 dark:text-red-400">{searchError}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            closeWeatherMenu()
            openSettings()
          }}
          className="mt-1 flex w-full items-center gap-1.5 rounded-md border-t border-slate-100 px-2 pt-2 pb-1 text-left text-xs text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Settings size={12} /> Weather settings (source, unit, label)…
        </button>
      </div>
    </>
  )
}
