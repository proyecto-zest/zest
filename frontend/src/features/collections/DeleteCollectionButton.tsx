import { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import { deleteCollection, type CollectionSummary } from '../../services/collections'
import { DeleteCollectionConfirmModal } from './DeleteCollectionConfirmModal'

interface DeleteCollectionButtonProps {
  collection: CollectionSummary
  onDeleted: (id: string) => void
}

export function DeleteCollectionButton({ collection, onDeleted }: DeleteCollectionButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    if (!pending) setOpen(false)
  }, [pending])

  const confirmDelete = async () => {
    if (pending) return
    setPending(true)
    setError(null)

    try {
      await deleteCollection(collection.id)
      setOpen(false)
      onDeleted(collection.id)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not delete the collection. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Delete collection"
        title={`Delete ${collection.name}`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setError(null)
          setOpen(true)
        }}
        className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/55 text-background backdrop-blur transition-colors hover:bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>

      {open && (
        <DeleteCollectionConfirmModal
          name={collection.name}
          pending={pending}
          error={error}
          onConfirm={confirmDelete}
          onCancel={close}
        />
      )}
    </>
  )
}
