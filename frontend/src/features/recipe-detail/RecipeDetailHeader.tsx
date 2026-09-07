import { RecipeImage } from '../../components/RecipeImage'
import { RecipeMetaBadges } from '../../components/RecipeMetaBadges'
import type { RecipeDetailData } from '../../types/recipe'

interface RecipeDetailHeaderProps {
  recipe: RecipeDetailData
}

/** Image, title, description and meta badges at the top of the recipe detail page. */
export function RecipeDetailHeader({ recipe }: RecipeDetailHeaderProps) {
  return (
    <div className="grid gap-6 tablet:grid-cols-2">
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
        <RecipeImage src={recipe.imageUrls[0]} alt={recipe.title} />
      </div>

      <div className="flex flex-col justify-center gap-4">
        <h1 className="font-serif text-3xl font-bold leading-tight text-foreground tablet:text-4xl">
          {recipe.title}
        </h1>
        <p className="leading-relaxed text-muted-foreground">{recipe.description}</p>
        <RecipeMetaBadges
          category={recipe.category}
          difficulty={recipe.difficulty}
          time={recipe.time}
          timeUnit={recipe.timeUnit}
          servings={recipe.servings}
          size="lg"
        />
      </div>
    </div>
  )
}
