import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '../ui/toast'
import { deleteRecipe } from '../../services/recipes'
import { DeleteRecipeConfirmModal } from './DeleteRecipeConfirmModal'

/** Shared with the confirm modal's own Delete button, so both read as the same destructive action. */
export const deleteButtonClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-error px-4 py-2 text-sm font-semibold text-error-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60'

interface DeleteRecipeButtonProps {
  recipeId: string
  recipeTitle: string
  onDeleted: (id: string) => void
}

/**
 * Delete entry point for a `RecipeCard`. Visible on every card for now — no
 * authentication yet to check authorship against.
 * TODO(ZEST-41): once auth exists, hide this for recipes the current user
 * doesn't own (Stage 2).
 */
export function DeleteRecipeButton({ recipeId, recipeTitle, onDeleted }: DeleteRecipeButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const { showToast } = useToast()

  const confirmDelete = async () => {
    setPending(true)
    try {
      await deleteRecipe(recipeId)
      setOpen(false)
      onDeleted(recipeId)
      showToast('Recipe deleted.')
    } catch (err) {
      setPending(false)
      setOpen(false)
      showToast(err instanceof Error ? err.message : 'Could not delete the recipe. Please try again.', 'error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={deleteButtonClasses}
      >
        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        Delete
      </button>

      {open && (
        <DeleteRecipeConfirmModal
          title={recipeTitle}
          pending={pending}
          onConfirm={confirmDelete}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}
