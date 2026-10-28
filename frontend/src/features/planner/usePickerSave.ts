import { useRef, useState } from 'react'
import type { PickedRecipe, PickerSelection } from './types'

/**
 * Runs the picker's save: while it is pending every row is disabled (no double
 * submit), on success the picker closes, on failure it stays open with the message.
 */
export function usePickerSave(
  onSave: (recipe: PickedRecipe) => Promise<void>,
  onClose: () => void,
) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  // A ref, not `pendingId`: two clicks in the same tick both see the state from before the first.
  const busy = useRef(false)

  const save = async (recipe: PickedRecipe) => {
    if (busy.current) return
    busy.current = true
    setPendingId(recipe.id)
    setError('')
    try {
      await onSave(recipe)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the meal. Please try again.')
      busy.current = false
      setPendingId(null)
    }
  }

  const selection: PickerSelection = { pendingId, onSelect: (recipe) => void save(recipe) }
  return { selection, error, saving: pendingId !== null }
}
