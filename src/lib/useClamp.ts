import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/**
 * Collapse long text to a few lines and report whether it really overflowed,
 * so a "See more" control appears only where there is more to see.
 *
 * The measurement runs only while collapsed. Expanding removes the clamp, at
 * which point scrollHeight equals clientHeight and a live measurement would
 * report "fits" — pulling the "See less" control out from under the reader.
 * The last collapsed reading therefore stands until the text closes again.
 *
 * Callers own their own markup and clamp class: note text is a <p> the tests
 * query, the pinned tile is a <button>, and a nested button would be invalid
 * HTML. Returning a ref keeps both shapes possible.
 */
export function useClamp<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    // +1 absorbs the sub-pixel rounding of a fractional line height.
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text, expanded])

  const toggle = useCallback(() => setExpanded((v) => !v), [])
  return { ref, expanded, overflows, toggle }
}
