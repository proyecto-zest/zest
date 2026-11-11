import { Calendar } from 'lucide-react'
import { Alert } from '../../components/alert'
import { buttonClasses } from '../../components/ui/buttonVariants'
import { useAddToPlanner } from './useAddToPlanner'
import { useDatePicker } from './useDatePicker'

interface AddToPlannerButtonProps {
  recipeId: string
  recipeTitle: string
}

/**
 * Pill that opens the browser's date picker and plans the recipe on the day picked.
 * The real `<input type="date">` sits invisible over the pill, so it stays focusable
 * and the picker anchors to it.
 */
export function AddToPlannerButton({ recipeId, recipeTitle }: AddToPlannerButtonProps) {
  const { add, pending, error } = useAddToPlanner(recipeId, recipeTitle)
  const { inputRef, openPicker, handleChange } = useDatePicker((date) => void add(date), pending)

  return (
    <div className="flex flex-col items-start gap-3">
      <label
        onClick={openPicker}
        className={buttonClasses({
          variant: 'secondary',
          size: 'md',
          className:
            'relative cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-ring/50',
        })}
      >
        <Calendar aria-hidden="true" className="h-4 w-4" />
        {pending ? 'Adding…' : 'Add to planner'}
        <input
          ref={inputRef}
          type="date"
          aria-label="Add to meal planner"
          disabled={pending}
          onChange={handleChange}
          onClick={(event) => event.stopPropagation()}
          className="pointer-events-none absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {error && <Alert variant="error" title="Couldn't add to planner" message={error} />}
    </div>
  )
}
