import { useState } from 'react'
import { X } from 'lucide-react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { addRecipeToCollection, type CollectionDetail } from '../../services/collections'
import type {
  CollectionDifficulty,
  CollectionSearchField,
} from '../../services/collectionRecipeSearch'
import { Pagination } from '../feed/Pagination'
import { AddCollectionRecipeRow } from './AddCollectionRecipeRow'
import { CollectionRecipeSearchControls } from './CollectionRecipeSearchControls'
import { useCollectionRecipeSearch } from './useCollectionRecipeSearch'

interface AddRecipesToCollectionModalProps {
  collection: CollectionDetail
  onAdded: () => void
  onClose: () => void
}

export function AddRecipesToCollectionModal({
  collection,
  onAdded,
  onClose,
}: AddRecipesToCollectionModalProps) {
  const [field, setField] = useState<CollectionSearchField>('name')
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<CollectionDifficulty>('')
  const [page, setPage] = useState(1)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [addError, setAddError] = useState('')
  const { state, retry } = useCollectionRecipeSearch({ field, query, difficulty, page })
  const addedIds = new Set(collection.recipes.map((recipe) => recipe.id))

  const close = () => {
    if (!pendingId) onClose()
  }
  const add = async (recipeId: string) => {
    if (pendingId || addedIds.has(recipeId)) return
    setPendingId(recipeId)
    setAddError('')
    try {
      await addRecipeToCollection(collection.id, recipeId)
      onAdded()
      onClose()
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : 'Could not add the recipe. Please try again.',
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Modal labelledBy="add-to-collection-title" onClose={close} size="lg">
      <div className="flex max-h-[84vh] flex-col overflow-hidden rounded-3xl bg-background shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <div id="add-to-collection-title" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Add to collection
            </p>
            <h2 className="mt-0.5 break-words font-serif text-2xl font-bold text-foreground">
              {collection.name}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={Boolean(pendingId)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-60"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <CollectionRecipeSearchControls
          field={field}
          query={query}
          difficulty={difficulty}
          disabled={Boolean(pendingId)}
          onFieldChange={(value) => {
            setField(value)
            setPage(1)
          }}
          onQueryChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          onDifficultyChange={(value) => {
            setDifficulty(value)
            setPage(1)
          }}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6 pt-4">
          {addError && <Alert variant="error" message={addError} />}
          {state.status === 'loading' && (
            <div role="status" className="flex flex-col gap-2.5">
              <span className="sr-only">Loading recipes…</span>
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="h-20 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          )}
          {state.status === 'error' && (
            <div className="flex flex-col items-start gap-3">
              <Alert variant="error" title="Couldn't search recipes" message={state.message} />
              {state.retryable && (
                <Button variant="secondary" onClick={retry}>
                  Try again
                </Button>
              )}
            </div>
          )}
          {state.status === 'ok' && state.data.recipes.length === 0 && (
            <p className="my-5 break-words text-center text-sm text-muted-foreground">
              No recipes match &quot;{query}&quot;.
            </p>
          )}
          {state.status === 'ok' &&
            state.data.recipes.map((recipe) => (
              <AddCollectionRecipeRow
                key={recipe.id}
                recipe={recipe}
                added={addedIds.has(recipe.id)}
                pending={pendingId === recipe.id}
                disabled={Boolean(pendingId)}
                onAdd={() => {
                  void add(recipe.id)
                }}
              />
            ))}
          {state.status === 'ok' && (
            <fieldset disabled={Boolean(pendingId)} className="min-w-0">
              <Pagination
                page={page}
                totalPages={state.data.pagination.totalPages}
                onPageChange={setPage}
              />
            </fieldset>
          )}
        </div>
      </div>
    </Modal>
  )
}
