import { Coffee } from 'lucide-react'
import { BUY_ME_A_COFFEE_URL } from '../config'

/**
 * The support link — or nothing at all, which is the state it ships in.
 *
 * Colour and size come from the caller so the same link can sit in the
 * 11px footer and under the dashboard without either one looking borrowed.
 */
export function CoffeeLink({ className = '' }: { className?: string }) {
  if (BUY_ME_A_COFFEE_URL === '') return null
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1 hover:underline ${className}`}
    >
      <Coffee size={12} />
      Buy me a coffee
    </a>
  )
}
