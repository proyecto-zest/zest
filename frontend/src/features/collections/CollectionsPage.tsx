import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { CollectionCard } from './CollectionCard'
import { useCollections } from './useCollections'

export function CollectionsPage() {
  const { state, retry, removeCollection } = useCollections()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground tablet:text-4xl">
            My Collections
          </h1>
          <p className="mt-1 text-muted-foreground">
            Organize your favorite recipes into themed groups.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          New collection
        </Button>
      </div>

      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error" title="Couldn't load collections" message={state.message} />
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {state.status !== 'error' && (
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
          >
            <Plus aria-hidden="true" className="h-8 w-8" />
            <span className="text-sm font-medium">New collection</span>
          </button>

          {state.status === 'loading' &&
            Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="aspect-square animate-pulse rounded-2xl bg-muted"
              />
            ))}

          {state.status === 'ok' &&
            state.collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onDeleted={removeCollection}
              />
            ))}
        </div>
      )}

      {createOpen && (
        <Modal labelledBy="new-collection-title" onClose={() => setCreateOpen(false)}>
          <div className="rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <h2 id="new-collection-title" className="font-serif text-2xl font-bold">
                New collection
              </h2>
              <button type="button" aria-label="Close" onClick={() => setCreateOpen(false)}>
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            {/* The creation form is added in ZEST-93, on top of this grid ticket. */}
            <div className="mt-8 flex justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
