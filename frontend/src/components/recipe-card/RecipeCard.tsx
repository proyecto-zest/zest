import { Link } from 'react-router-dom'
import { Clock, Gauge } from 'lucide-react'
import { enumLabel } from '../../lib/enumLabels'
import type { RecipeCardData } from '../../types/recipe'
import { difficultyBadgeClasses, difficultyBadgeFallback } from './difficultyBadgeVariants'
import { RecipeCardImage } from './RecipeCardImage'
import { recipeCardChipClasses, recipeCardShellClasses } from './recipeCardVariants'

interface RecipeCardProps {
  recipe: RecipeCardData
}

/**
 * The single reusable recipe card — the feed, search, collections and the
 * planner all render this. `category` stays a neutral chip in the body;
 * `difficulty` is a colored badge over the image (green/yellow/red for
 * easy/medium/hard) so the two aren't visually interchangeable at a glance.
 */
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`group ${recipeCardShellClasses} hover:shadow-lg hover:shadow-foreground/5`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <RecipeCardImage src={recipe.imageUrls[0]} alt={recipe.title} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Clock aria-hidden="true" className="h-3 w-3 text-primary" />
          {recipe.time}
        </span>
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            difficultyBadgeClasses[recipe.difficulty] ?? difficultyBadgeFallback
          }`}
        >
          <Gauge aria-hidden="true" className="h-3 w-3" />
          {enumLabel(recipe.difficulty)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className={`self-start ${recipeCardChipClasses}`}>{enumLabel(recipe.category)}</span>

        <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-foreground">{recipe.title}</h3>
      </div>
    </Link>
  )
}
