import { Link } from 'react-router-dom'
import { Bookmark, Clock, Gauge } from 'lucide-react'
import { RecipeImage } from '../RecipeImage'
import { RecipeAuthor } from '../recipe-author'
import { enumLabel } from '../../lib/enumLabels'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import type { CollectionRecipeCardData, RecipeCardData } from '../../types/recipe'
import { DeleteRecipeButton } from './DeleteRecipeButton'
import { difficultyBadgeClasses, difficultyBadgeFallback } from './difficultyBadgeVariants'
import { EditRecipeButton } from './EditRecipeButton'
import { recipeCardChipClasses, recipeCardShellClasses } from './recipeCardVariants'

interface RecipeCardProps {
  recipe: RecipeCardData | CollectionRecipeCardData
  currentUserId?: string
  /** Called after this recipe is deleted from the card's own delete button. */
  onDeleted?: (id: string) => void
  /** Supplied by the collection/save flow; no membership requests happen inside the card. */
  onSave?: () => void
}

/**
 * The single reusable recipe card — the feed, search, collections and the
 * planner all render this. `category` stays a neutral chip in the body;
 * `difficulty` is a colored badge over the image (green/yellow/red for
 * easy/medium/hard) so the two aren't visually interchangeable at a glance.
 */
export function RecipeCard({ recipe, currentUserId, onDeleted, onSave }: RecipeCardProps) {
  const isOwner = Boolean(currentUserId && recipe.author && currentUserId === recipe.author.id)
  const isCollectionCard = !('imageUrls' in recipe)
  const imageUrl = 'imageUrls' in recipe ? recipe.imageUrls[0] : recipe.imageUrl

  return (
    <div
      className={`group relative ${recipeCardShellClasses} hover:shadow-lg hover:shadow-foreground/5`}
    >
      <Link
        to={`/recipes/${recipe.id}`}
        aria-label={`View recipe ${recipe.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <RecipeImage src={imageUrl ?? undefined} alt={recipe.title} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Clock aria-hidden="true" className="h-3 w-3 text-primary" />
          {formatRecipeTime(recipe.time, recipe.timeUnit)}
        </span>
        {'difficulty' in recipe && (
          <span
            className={`absolute ${onSave ? 'right-14' : 'right-3'} top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              difficultyBadgeClasses[recipe.difficulty] ?? difficultyBadgeFallback
            }`}
          >
            <Gauge aria-hidden="true" className="h-3 w-3" />
            {enumLabel(recipe.difficulty)}
          </span>
        )}
        {(isCollectionCard || onSave) && (
          <button
            type="button"
            aria-label="Save to collection"
            disabled={!onSave}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onSave?.()
            }}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <Bookmark aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
        {isOwner && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <EditRecipeButton recipeId={recipe.id} />
            {onDeleted && (
              <DeleteRecipeButton
                recipeId={recipe.id}
                recipeTitle={recipe.title}
                onDeleted={onDeleted}
                iconOnly
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {'category' in recipe && (
          <span className={`self-start ${recipeCardChipClasses}`}>
            {enumLabel(recipe.category)}
          </span>
        )}

        <h3 className="line-clamp-2 break-words font-serif text-lg font-bold leading-snug text-foreground">
          {recipe.title}
        </h3>

        <RecipeAuthor author={recipe.author} />
      </div>
    </div>
  )
}
