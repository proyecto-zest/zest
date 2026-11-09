import { useRef, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { deletePlannerEntry } from '../../services/planner'

/**
 * Deletes one planned meal. On success the week reloads and the dialog closes.
 * A 404 counts as success: the meal is already gone, which is what the user
 * wanted. Any other error keeps the dialog open with the backend's message.
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
      if (e instanceof HttpError && e.status === 404) {
        refetch()
        onDone()
        return
      }
      setError(e instanceof Error ? e.message : 'Could not remove the meal. Please try again.')
      busy.current = false
      setPending(false)
    }
  }

  return { remove, pending, error }
}
