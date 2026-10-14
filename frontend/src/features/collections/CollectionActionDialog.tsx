import { X } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'

interface CollectionActionDialogProps {
  title: 'Add to collection' | 'Save to collection'
  subtitle: string
  onClose: () => void
}

/** Dialog entry point; ZEST-95/96 supply the search and membership controls. */
export function CollectionActionDialog({ title, subtitle, onClose }: CollectionActionDialogProps) {
  return (
    <Modal labelledBy="collection-action-title" onClose={onClose}>
      <div className="overflow-hidden rounded-3xl bg-background shadow-lg">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <h2
              id="collection-action-title"
              className="font-serif text-2xl font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  )
}
