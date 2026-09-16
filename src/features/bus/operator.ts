import { tintChipCls } from '../../components/ui/swatches'
import type { BusOperator } from '../../types'

/** Route-number chip per operator, roughly their own liveries. Full literal
 *  class strings, per the swatches rule — and in their own module so the
 *  components that use them stay fast-refreshable. */
export const operatorChipCls: Record<BusOperator, string> = {
  KMB: tintChipCls.rose,
  CTB: tintChipCls.amber,
}

/** What the operator is called on screen — "CTB" is the API's spelling, not
 *  a name anyone waiting at a stop would recognise. */
export const operatorName: Record<BusOperator, string> = { KMB: 'KMB', CTB: 'Citybus' }
