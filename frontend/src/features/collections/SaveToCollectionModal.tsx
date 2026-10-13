import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import {
  addRecipeToCollection,
  removeRecipeFromCollection,
  type RecipeCollectionSummary,
} from '../../services/collections'
import { CreateCollectionModal } from './CreateCollectionModal'
import { SaveCollectionRow } from './SaveCollectionRow'
import { useRecipeCollections } from './useRecipeCollections'

interface SaveToCollectionModalProps {
  recipe: { id: string; title: string }
  onClose: () => void
  onChanged?: () => void
}

export function SaveToCollectionModal({ recipe, onClose, onChanged }: SaveToCollectionModalProps) {
  const { state, retry, setMembership } = useRecipeCollections(recipe.id)
  const [creating, setCreating] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const busy = useRef(false)
  const [error, setError] = useState('')
  const close = () => {
    if (!busy.current) onClose()
  }
  const toggle = async (collection: RecipeCollectionSummary) => {
    if (busy.current) return
    busy.current = true
    setPendingId(collection.id)
    setError('')
    try {
      if (collection.containsRecipe) await removeRecipeFromCollection(collection.id, recipe.id)
      else await addRecipeToCollection(collection.id, recipe.id)
      setMembership(collection.id, !collection.containsRecipe)
      onChanged?.()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save the change. Please try again.',
      )
    } finally {
      busy.current = false
      setPendingId(null)
    }
  }
  if (creating)
    return (
      <CreateCollectionModal
        recipeId={recipe.id}
        onClose={() => {
          setCreating(false)
          // Creation may have succeeded even if adding the recipe failed.
          // Re-read membership on every return, including Cancel, X and Escape.
          retry()
        }}
        onCreated={() => {
          onChanged?.()
        }}
      />
    )
  return (
    <Modal labelledBy="save-to-collection-title" onClose={close}>
      <div className="flex max-h-[84vh] flex-col overflow-hidden rounded-3xl bg-background shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Save to collection
            </p>
            <h2
              id="save-to-collection-title"
              className="mt-1 break-words font-serif text-xl font-bold text-foreground"
            >
              {recipe.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={pendingId !== null}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5 overflow-y-auto px-6 py-4">
          {error && <Alert variant="error" message={error} />}
          {state.status === 'loading' && (
            <p role="status" className="py-4 text-sm text-muted-foreground">
              Loading collections…
            </p>
          )}
          {state.status === 'error' && (
            <>
              <Alert variant="error" message={state.message} />
              <Button variant="secondary" onClick={retry}>
                Try again
              </Button>
            </>
          )}
          {state.status === 'ok' &&
            state.collections.map((collection) => (
              <SaveCollectionRow
                key={collection.id}
                collection={collection}
                pending={pendingId === collection.id}
                disabled={pendingId !== null}
                onToggle={() => void toggle(collection)}
              />
            ))}
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={pendingId !== null}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background px-3 py-2.5 text-left text-primary disabled:opacity-60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Plus aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">New collection</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
