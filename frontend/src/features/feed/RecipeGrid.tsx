import { RecipeCard, RecipeCardSkeleton } from '../../components/recipe-card'
import type { RecipeCardData } from '../../types/recipe'

interface RecipeGridProps {
  recipes: RecipeCardData[]
}

/** 1 column on mobile, 2 on tablet, 3 on desktop — the design system only defines those two breakpoints. */
const gridClasses = 'grid grid-cols-1 gap-5 tablet:grid-cols-2 desktop:grid-cols-3'

export function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <div className={gridClasses}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}

/** Same grid, filled with skeleton cards — shown while the first page is loading. */
export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={gridClasses}>
      {Array.from({ length: count }, (_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  )
}
