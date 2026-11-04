import { useRef, useState } from 'react'
import { useToast } from '../../components/ui/toast'
import { updatePlannerEntry, type PlannerEntry } from '../../services/planner'

export const MAX_QUANTITY = 100

/**
 * Step ± one portion on a planned meal. The number changes on screen at once and
 * goes back, with an error toast, if PATCH /planner/:id fails. Stepping down from
 * 1 is not a quantity change: it hands over to `onRemove`, the existing remove flow.
 */
export function useMealQuantity(
  entry: PlannerEntry,
  setQuantity: (id: string, quantity: number) => void,
  onRemove: () => void,
) {
  const { showToast } = useToast()
  const [pending, setPending] = useState(false)
  // A ref, not `pending`: two clicks in the same tick both see the state from before the first.
  const busy = useRef(false)

  const change = async (next: number) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    const previous = entry.quantity
    setQuantity(entry.id, next)
    try {
      await updatePlannerEntry(entry.id, next)
    } catch (e) {
      setQuantity(entry.id, previous)
      showToast(
        e instanceof Error ? e.message : 'Could not change the quantity. Please try again.',
        'error',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  const decrease = () => (entry.quantity <= 1 ? onRemove() : void change(entry.quantity - 1))
  const increase = () => void change(entry.quantity + 1)
  return { pending, decrease, increase, canIncrease: entry.quantity < MAX_QUANTITY }
}
