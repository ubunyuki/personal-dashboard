import { useState } from 'react'
import { Globe } from 'lucide-react'
import { domainOf } from '../../lib/bookmarks/url'

/** Site favicon via DuckDuckGo's icon service; falls back to a globe when the
 *  domain is unparsable, the icon 404s, or the app is offline. */
export function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  const domain = domainOf(url)
  if (!domain || failed) {
    return (
      <Globe size={16} strokeWidth={1.75} className="shrink-0 text-slate-400 dark:text-slate-500" />
    )
  }
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      className="h-4 w-4 shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  )
}
