import { useRef, useState } from 'react'
import { useToast } from '../../components/ui/toast'
import { createPlannerEntry } from '../../services/planner'
import { formatPlannerDate } from '../planner/formatPlannerDate'

/**
 * Plans one portion of the recipe on the chosen day (POST /planner), confirms
 * with a toast and keeps the backend's message in `error` so the page can show it.
 */
export function useAddToPlanner(recipeId: string, recipeTitle: string) {
  const { showToast } = useToast()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  // A ref, not `pending`: two changes in the same tick both see the state from before the first.
  const busy = useRef(false)

  const add = async (date: string) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await createPlannerEntry({ recipeId, date, quantity: 1 })
      showToast(`"${recipeTitle}" was added to ${formatPlannerDate(date)}.`)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not add the recipe to the planner. Please try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return { add, pending, error }
}
