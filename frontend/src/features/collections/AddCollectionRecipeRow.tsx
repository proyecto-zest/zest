import { Loader2, Plus } from 'lucide-react'
import { RecipeImage } from '../../components/RecipeImage'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import type { RecipeCardData } from '../../types/recipe'

interface AddCollectionRecipeRowProps {
  recipe: RecipeCardData
  added: boolean
  pending: boolean
  disabled: boolean
  onAdd: () => void
}

export function AddCollectionRecipeRow({
  recipe,
  added,
  pending,
  disabled,
  onAdd,
}: AddCollectionRecipeRowProps) {
  return (
    <button
      type="button"
      aria-label={added ? `${recipe.title}, Added` : `Add ${recipe.title} to collection`}
      aria-busy={pending}
      disabled={added || disabled}
      onClick={onAdd}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        <RecipeImage src={recipe.imageUrls[0]} alt="" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-foreground">{recipe.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRecipeTime(recipe.time, recipe.timeUnit)}
        </p>
      </div>
      {added && <span className="shrink-0 text-xs font-semibold text-success">Added</span>}
      {pending ? (
        <span className="shrink-0" role="status">
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />
          <span className="sr-only">Adding recipe…</span>
        </span>
      ) : (
        <Plus aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
      )}
    </button>
  )
}
