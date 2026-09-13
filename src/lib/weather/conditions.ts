export type ConditionIcon =
  | 'sun'
  | 'moon'
  | 'partly'
  | 'partly-night'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'wind'

export interface Condition {
  icon: ConditionIcon
  label: string
}

const FALLBACK: Condition = { icon: 'cloud', label: 'Weather' }

/** Open-Meteo current.weather_code (WMO 4677 subset) → condition. */
export function wmoToCondition(code: number, isDay: boolean): Condition {
  if (code === 0) return isDay ? { icon: 'sun', label: 'Clear' } : { icon: 'moon', label: 'Clear' }
  if (code === 1 || code === 2)
    return isDay
      ? { icon: 'partly', label: 'Partly cloudy' }
      : { icon: 'partly-night', label: 'Partly cloudy' }
  if (code === 3) return { icon: 'cloud', label: 'Overcast' }
  if (code === 45 || code === 48) return { icon: 'fog', label: 'Fog' }
  if (code >= 51 && code <= 57) return { icon: 'drizzle', label: 'Drizzle' }
  if (code >= 61 && code <= 67) return { icon: 'rain', label: 'Rain' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { icon: 'snow', label: 'Snow' }
  if (code >= 80 && code <= 82) return { icon: 'rain', label: 'Showers' }
  if (code >= 95) return { icon: 'thunder', label: 'Thunderstorm' }
  return FALLBACK
}

/** HKO rhrread icon code (first entry of `icon`) → condition.
 *  Codes per HKO's published icon list; unknown codes fall back gracefully. */
export function hkoIconToCondition(code: number | undefined): Condition {
  if (code == null) return FALLBACK
  const map: Record<number, Condition> = {
    50: { icon: 'sun', label: 'Sunny' },
    51: { icon: 'partly', label: 'Sunny periods' },
    52: { icon: 'partly', label: 'Sunny intervals' },
    53: { icon: 'drizzle', label: 'Sunny periods with showers' },
    54: { icon: 'drizzle', label: 'Sunny intervals with showers' },
    60: { icon: 'cloud', label: 'Cloudy' },
    61: { icon: 'cloud', label: 'Overcast' },
    62: { icon: 'drizzle', label: 'Light rain' },
    63: { icon: 'rain', label: 'Rain' },
    64: { icon: 'rain', label: 'Heavy rain' },
    65: { icon: 'thunder', label: 'Thunderstorms' },
    76: { icon: 'partly-night', label: 'Mainly cloudy' },
    77: { icon: 'partly-night', label: 'Mainly fine' },
    80: { icon: 'wind', label: 'Windy' },
    81: { icon: 'sun', label: 'Dry' },
    82: { icon: 'cloud', label: 'Humid' },
    83: { icon: 'fog', label: 'Fog' },
    84: { icon: 'fog', label: 'Mist' },
    85: { icon: 'fog', label: 'Haze' },
    90: { icon: 'sun', label: 'Hot' },
    91: { icon: 'sun', label: 'Warm' },
    92: { icon: 'cloud', label: 'Cool' },
    93: { icon: 'cloud', label: 'Cold' },
  }
  if (map[code]) return map[code]
  if (code >= 70 && code <= 75) return { icon: 'moon', label: 'Fine' }
  return FALLBACK
}
