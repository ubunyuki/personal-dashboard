import type { WeatherLocation } from '../../types'
import { hkoIconToCondition, wmoToCondition, type ConditionIcon } from './conditions'

export interface WeatherNow {
  tempC: number
  label: string
  icon: ConditionIcon
  place: string
  humidity?: number
  observedAt?: string
}

const HKO_URL =
  'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en'

interface HkoRhrread {
  temperature?: { data?: Array<{ place: string; value: number; unit: string }>; recordTime?: string }
  humidity?: { data?: Array<{ value: number; place: string }> }
  icon?: number[]
}

async function fetchRhrread(): Promise<HkoRhrread> {
  const res = await fetch(HKO_URL)
  if (!res.ok) throw new Error(`HKO ${res.status}`)
  return (await res.json()) as HkoRhrread
}

export async function fetchHko(station: string): Promise<WeatherNow> {
  const j = await fetchRhrread()
  const temps = j.temperature?.data ?? []
  const t =
    temps.find((d) => d.place === station) ??
    temps.find((d) => d.place === 'Hong Kong Observatory') ??
    temps[0]
  if (!t) throw new Error('HKO returned no temperature data')
  const cond = hkoIconToCondition(j.icon?.[0])
  return {
    tempC: t.value,
    label: cond.label,
    icon: cond.icon,
    place: t.place,
    humidity: (j.humidity?.data?.find((d) => d.place === t.place) ?? j.humidity?.data?.[0])?.value,
    observedAt: j.temperature?.recordTime,
  }
}

let stationsMemo: { at: number; list: string[] } | null = null

export async function listHkoStations(): Promise<string[]> {
  if (stationsMemo && Date.now() - stationsMemo.at < 30 * 60_000) return stationsMemo.list
  const j = await fetchRhrread()
  const list = (j.temperature?.data ?? []).map((d) => d.place).sort()
  if (list.length > 0) stationsMemo = { at: Date.now(), list }
  return list
}

export async function fetchOpenMeteo(location: WeatherLocation | undefined): Promise<WeatherNow> {
  if (!location) throw new Error('No city selected')
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
    '&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const j = (await res.json()) as {
    current?: {
      temperature_2m?: number
      relative_humidity_2m?: number
      weather_code?: number
      is_day?: number
      time?: string
    }
  }
  const c = j.current
  if (!c || typeof c.temperature_2m !== 'number') throw new Error('Open-Meteo returned no data')
  const cond = wmoToCondition(c.weather_code ?? -1, (c.is_day ?? 1) === 1)
  return {
    tempC: c.temperature_2m,
    label: cond.label,
    icon: cond.icon,
    place: location.name,
    humidity: c.relative_humidity_2m,
    observedAt: c.time,
  }
}

export async function geocodeCity(query: string): Promise<WeatherLocation[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
  )
  if (!res.ok) throw new Error(`Geocoding ${res.status}`)
  const j = (await res.json()) as {
    results?: Array<{
      name: string
      admin1?: string
      country?: string
      latitude: number
      longitude: number
    }>
  }
  return (j.results ?? []).map((r) => ({
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}
