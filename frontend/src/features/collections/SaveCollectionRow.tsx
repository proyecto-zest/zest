import { Bookmark, LoaderCircle } from 'lucide-react'
import type { RecipeCollectionSummary } from '../../services/collections'

interface SaveCollectionRowProps {
  collection: RecipeCollectionSummary
  pending: boolean
  disabled: boolean
  onToggle: () => void
}

export function SaveCollectionRow({
  collection,
  pending,
  disabled,
  onToggle,
}: SaveCollectionRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={collection.containsRecipe}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-left disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="h-11 w-11 shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: collection.accentColor }}
      >
        {collection.coverImageUrl && (
          <img src={collection.coverImageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">
        {collection.name}
      </span>
      {pending ? (
        <LoaderCircle aria-label="Saving" className="h-4 w-4 shrink-0 animate-spin text-primary" />
      ) : (
        <Bookmark
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 ${collection.containsRecipe ? 'text-primary' : 'text-muted-foreground'}`}
          fill={collection.containsRecipe ? 'currentColor' : 'none'}
        />
      )}
    </button>
  )
}
