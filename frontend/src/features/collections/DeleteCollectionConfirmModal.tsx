import { Alert } from '../../components/alert'
import { deleteButtonClasses } from '../../components/recipe-card/DeleteRecipeButton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'

interface DeleteCollectionConfirmModalProps {
  name: string
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

/** Uses the existing recipe deletion dialog styles for collection confirmation. */
export function DeleteCollectionConfirmModal({
  name,
  pending,
  error,
  onConfirm,
  onCancel,
}: DeleteCollectionConfirmModalProps) {
  return (
    <Modal onClose={onCancel} labelledBy="delete-collection-title">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 id="delete-collection-title" className="font-serif text-xl font-bold text-foreground">
            Delete collection?
          </h2>
          <p className="mt-1.5 break-words text-sm text-muted-foreground">
            This will permanently remove &ldquo;{name}&rdquo;. The recipes in this collection will
            not be deleted. This can&rsquo;t be undone.
          </p>
        </div>

        {error && <Alert variant="error" message={error} />}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={deleteButtonClasses}
          >
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
