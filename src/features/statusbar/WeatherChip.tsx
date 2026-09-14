import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
} from 'lucide-react'
import { format } from 'date-fns'
import type { ConditionIcon } from '../../lib/weather/conditions'
import { shortLabel } from '../../lib/weather/stationCodes'
import { getWeather, isWeatherStale } from '../../lib/weather/weather'
import type { WeatherNow } from '../../lib/weather/providers'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { WeatherMenu } from './WeatherMenu'

const HKO_HOME = 'https://www.hko.gov.hk/en/index.html'

const icons: Record<ConditionIcon, typeof Cloud> = {
  sun: Sun,
  moon: Moon,
  partly: CloudSun,
  'partly-night': CloudMoon,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  wind: Wind,
}

/** Status-bar weather: [place ▾] [icon temp · RH]. The place name opens a
 *  location dropdown; the readings link to the HKO site for full detail. */
export function WeatherChip() {
  const weather = useAppStore((s) => s.settings.weather)
  const menuOpen = useUiStore((s) => s.weatherMenuOpen)
  const toggleWeatherMenu = useUiStore((s) => s.toggleWeatherMenu)
  const [state, setState] = useState<WeatherNow | 'error' | null>(null)

  useEffect(() => {
    if (!weather.enabled) return
    let alive = true
    const load = () => {
      getWeather(weather)
        .then((d) => alive && setState(d))
        .catch(() => alive && setState('error'))
    }
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isWeatherStale(weather)) load()
    }
    document.addEventListener('visibilitychange', onVisible)
    const id = window.setInterval(() => {
      if (isWeatherStale(weather)) load()
    }, 10 * 60_000)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(id)
    }
  }, [weather])

  if (!weather.enabled) return null

  const ok = state !== null && state !== 'error' ? state : null
  const temp =
    ok == null
      ? null
      : Math.round(weather.unit === 'fahrenheit' ? (ok.tempC * 9) / 5 + 32 : ok.tempC)
  const Icon = ok ? icons[ok.icon] : Cloud
  // Label reflects the SELECTED location from settings, never the cached
  // fetch's place (which may be a fallback station).
  const selectedName = weather.source === 'hko' ? weather.hkoStation : weather.location?.name
  const label =
    selectedName == null
      ? weather.source === 'open-meteo'
        ? 'Pick city'
        : null
      : (weather.labelStyle ?? 'name') === 'code'
        ? shortLabel(selectedName)
        : selectedName
  const updated =
    ok?.observedAt && !Number.isNaN(Date.parse(ok.observedAt))
      ? ` · updated ${format(new Date(ok.observedAt), 'HH:mm')}`
      : ''
  const title = ok
    ? `${ok.place} · ${ok.label} · ${Math.round(ok.tempC)}°C${
        ok.humidity != null ? ` · ${Math.round(ok.humidity)}% RH` : ''
      }${updated} — open HKO site`
    : state === 'error'
      ? 'Weather unavailable — click the place name to change location'
      : 'Loading weather…'

  return (
    <div className="relative flex items-center text-sm text-slate-600 dark:text-slate-300">
      {label && (
        <button
          type="button"
          onClick={toggleWeatherMenu}
          title="Change location"
          className="hidden items-center gap-0.5 rounded-md px-1.5 py-1 hover:bg-slate-100 sm:flex dark:hover:bg-slate-800"
        >
          <span className="max-w-32 truncate">{label}</span>
          <ChevronDown size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
        </button>
      )}
      <a
        href={HKO_HOME}
        target="_blank"
        rel="noreferrer noopener"
        title={title}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          className={`text-slate-500 dark:text-slate-400 ${ok ? '' : 'opacity-50'}`}
        />
        <span className="whitespace-nowrap tabular-nums">{temp != null ? `${temp}°` : '—'}</span>
        {ok?.humidity != null && (
          <span className="hidden items-center tabular-nums sm:flex">
            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
            {Math.round(ok.humidity)}%
          </span>
        )}
      </a>
      {menuOpen && <WeatherMenu />}
    </div>
  )
}
