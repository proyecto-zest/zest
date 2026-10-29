import { Alert } from '../../components/alert'
import { deleteButtonClasses } from '../../components/recipe-card/DeleteRecipeButton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import type { PlannerEntry } from '../../services/planner'
import { formatPlannerDate } from './formatPlannerDate'
import { useRemoveMeal } from './useRemoveMeal'

interface RemoveMealDialogProps {
  entry: PlannerEntry
  /** Reload the week: the meal is gone, or turned out to be gone already. */
  refetch: () => void
  onClose: () => void
}

/** Asks before taking a planned meal off its day. */
export function RemoveMealDialog({ entry, refetch, onClose }: RemoveMealDialogProps) {
  const { remove, pending, error } = useRemoveMeal(entry.id, refetch, onClose)
  // Closing mid-request would hide whether the meal was actually removed.
  const cancel = () => {
    if (!pending) onClose()
  }

  return (
    <Modal onClose={cancel} labelledBy="remove-meal-title">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 id="remove-meal-title" className="font-serif text-xl font-bold text-foreground">
            Remove meal?
          </h2>
          <p className="mt-1.5 break-words text-sm text-muted-foreground">
            &ldquo;{entry.title}&rdquo; will be taken off {formatPlannerDate(entry.date)}. The
            recipe itself is not deleted.
          </p>
        </div>

        {error && <Alert variant="error" message={error} />}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={cancel} disabled={pending}>
            Cancel
          </Button>
          <button type="button" onClick={remove} disabled={pending} className={deleteButtonClasses}>
            {pending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
