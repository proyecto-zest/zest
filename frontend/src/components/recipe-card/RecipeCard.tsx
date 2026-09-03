import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { enumLabel } from '../../lib/enumLabels'
import type { RecipeCardData } from '../../types/recipe'
import { RecipeCardImage } from './RecipeCardImage'
import { recipeCardChipClasses, recipeCardShellClasses } from './recipeCardVariants'

interface RecipeCardProps {
  recipe: RecipeCardData
}

/**
 * The single reusable recipe card — the feed, search, collections and the
 * planner all render this. Chips show `category`/`difficulty`: the wireframe's
 * author row and tag chips have no backing data yet (no `User` model, no
 * `labels` table) so they're left out rather than faked.
 */
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`group ${recipeCardShellClasses} hover:shadow-lg hover:shadow-foreground/5`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RecipeCardImage src={recipe.imageUrls[0]} alt={recipe.title} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Clock aria-hidden="true" className="h-3 w-3 text-primary" />
          {recipe.time}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className={recipeCardChipClasses}>{enumLabel(recipe.category)}</span>
          <span className={recipeCardChipClasses}>{enumLabel(recipe.difficulty)}</span>
        </div>

        <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-foreground">{recipe.title}</h3>
      </div>
    </Link>
  )
}
