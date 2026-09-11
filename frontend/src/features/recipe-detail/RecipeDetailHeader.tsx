import { Clock, Gauge } from 'lucide-react'
import { RecipeCardImage } from '../../components/recipe-card/RecipeCardImage'
import { difficultyBadgeClasses, difficultyBadgeFallback } from '../../components/recipe-card/difficultyBadgeVariants'
import { recipeCardChipClasses } from '../../components/recipe-card/recipeCardVariants'
import { enumLabel } from '../../lib/enumLabels'
import type { RecipeDetailData } from '../../types/recipe'

interface RecipeDetailHeaderProps {
  recipe: RecipeDetailData
}

/** Image, title, description and meta info at the top of the recipe detail page. */
export function RecipeDetailHeader({ recipe }: RecipeDetailHeaderProps) {
  return (
    <div className="grid gap-6 tablet:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
        <RecipeCardImage src={recipe.imageUrls[0]} alt={recipe.title} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Clock aria-hidden="true" className="h-3 w-3 text-primary" />
          {recipe.time} {enumLabel(recipe.timeUnit)}
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

      <div className="flex flex-col justify-center gap-4">
        <span className={`self-start ${recipeCardChipClasses}`}>{enumLabel(recipe.category)}</span>
        <h1 className="font-serif text-3xl font-bold leading-tight text-foreground tablet:text-4xl">
          {recipe.title}
        </h1>
        <p className="leading-relaxed text-muted-foreground">{recipe.description}</p>
        <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>
      </div>
    </div>
  )
}
