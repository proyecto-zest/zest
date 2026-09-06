import { Link } from 'react-router-dom'
import { RecipeImage } from '../RecipeImage'
import { RecipeMetaBadges } from '../RecipeMetaBadges'
import type { RecipeCardData } from '../../types/recipe'
import { recipeCardShellClasses } from './recipeCardVariants'

interface RecipeCardProps {
  recipe: RecipeCardData
}

/**
 * The single reusable recipe card — the feed, search, collections and the
 * planner all render this. `RecipeMetaBadges` shows `category`/`difficulty`/
 * `time`/`servings`: the wireframe's author row and tag chips have no backing
 * data yet (no `User` model, no `labels` table) so they're left out.
 */
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`group ${recipeCardShellClasses} hover:shadow-lg hover:shadow-foreground/5`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <RecipeImage src={recipe.imageUrls[0]} alt={recipe.title} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <RecipeMetaBadges
          category={recipe.category}
          difficulty={recipe.difficulty}
          time={recipe.time}
          servings={recipe.servings}
        />

        <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-foreground">{recipe.title}</h3>
      </div>
    </Link>
  )
}
