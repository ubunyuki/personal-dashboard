import { useEffect, useState } from 'react'
import {
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
import { getWeather, isWeatherStale } from '../../lib/weather/weather'
import type { WeatherNow } from '../../lib/weather/providers'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

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

export function WeatherChip() {
  const weather = useAppStore((s) => s.settings.weather)
  const openSettings = useUiStore((s) => s.openSettings)
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
  const updated =
    ok?.observedAt && !Number.isNaN(Date.parse(ok.observedAt))
      ? ` · updated ${format(new Date(ok.observedAt), 'HH:mm')}`
      : ''
  const title = ok
    ? `${ok.place} · ${ok.label} · ${Math.round(ok.tempC)}°C${
        ok.humidity != null ? ` · ${Math.round(ok.humidity)}% RH` : ''
      }${updated}`
    : state === 'error'
      ? 'Weather unavailable — click to configure'
      : 'Loading weather…'

  return (
    <button
      type="button"
      onClick={openSettings}
      title={title}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      <Icon size={14} strokeWidth={1.75} className={ok ? '' : 'opacity-50'} />
      <span className="tabular-nums">{temp != null ? `${temp}°` : '—'}</span>
    </button>
  )
}
