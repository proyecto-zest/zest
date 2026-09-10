import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

interface RecipeEditConfirmModalProps {
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** "Save changes?" confirmation — the PUT never fires until this is explicitly confirmed. */
export function RecipeEditConfirmModal({ pending, onConfirm, onCancel }: RecipeEditConfirmModalProps) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">Save changes?</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This will update the recipe with your changes.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
