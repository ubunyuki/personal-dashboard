import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <time
      dateTime={now.toISOString()}
      className="text-sm tabular-nums text-slate-600 dark:text-slate-300"
    >
      {format(now, 'EEE d MMM')}
      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
      {format(now, 'HH:mm')}
    </time>
  )
}
