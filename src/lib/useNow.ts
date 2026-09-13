import { useEffect, useState } from 'react'

/** Ticking "now" so derived views (overdue, buckets) flip without a reload. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
