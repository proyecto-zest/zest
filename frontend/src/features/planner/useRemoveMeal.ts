import { useRef, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { deletePlannerEntry } from '../../services/planner'

/**
 * Deletes one planned meal. On success the week reloads and the dialog closes.
 * On error the dialog stays open with the backend's message; a 404 also reloads
 * the week, since the meal is already gone and the grid should say so.
 */
export function useRemoveMeal(id: string, refetch: () => void, onDone: () => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  // A ref, not `pending`: two clicks in the same tick both see the state from before the first.
  const busy = useRef(false)

  const remove = async () => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await deletePlannerEntry(id)
      refetch()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the meal. Please try again.')
      if (e instanceof HttpError && e.status === 404) refetch()
      busy.current = false
      setPending(false)
    }
  }

  return { remove, pending, error }
}
