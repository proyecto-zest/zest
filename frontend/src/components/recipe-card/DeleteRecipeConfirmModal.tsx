import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { deleteButtonClasses } from './DeleteRecipeButton'

interface DeleteRecipeConfirmModalProps {
  title: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** "Delete recipe?" confirmation — nothing is deleted until this is explicitly confirmed. */
export function DeleteRecipeConfirmModal({ title, pending, onConfirm, onCancel }: DeleteRecipeConfirmModalProps) {
  return (
    <Modal onClose={onCancel} labelledBy="delete-recipe-title">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 id="delete-recipe-title" className="font-serif text-xl font-bold text-foreground">
            Delete recipe?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This will permanently remove &ldquo;{title}&rdquo;. This can&rsquo;t be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <button type="button" onClick={onConfirm} disabled={pending} className={deleteButtonClasses}>
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
