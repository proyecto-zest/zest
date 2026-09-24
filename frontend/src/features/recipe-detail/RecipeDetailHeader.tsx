import { RecipeImage } from '../../components/RecipeImage'
import { RecipeMetaBadges } from '../../components/RecipeMetaBadges'
import { RecipeAuthor } from '../../components/recipe-author'
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

      {/* `min-w-0`: a grid item (this `div` and the image before it) defaults
          to its content's natural width, which would let long unbroken text
          in the title/description below push the whole page wider than the
          viewport instead of wrapping. */}
      <div className="min-w-0 flex flex-col justify-center gap-4">
        <h1 className="break-words font-serif text-3xl font-bold leading-tight text-foreground tablet:text-4xl">
          {recipe.title}
        </h1>
        <p className="break-words leading-relaxed text-muted-foreground">{recipe.description}</p>
        <RecipeAuthor author={recipe.author} variant="detail" />
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
