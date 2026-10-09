import { RecipeCard } from '../../components/recipe-card'
import type { CollectionRecipeCardData } from '../../types/recipe'

interface CollectionRecipeGridProps {
  recipes: CollectionRecipeCardData[]
  onSaveRecipe?: (recipe: CollectionRecipeCardData) => void
}

export function CollectionRecipeGrid({ recipes, onSaveRecipe }: CollectionRecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No recipes in this collection yet.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,228px),1fr))] gap-5">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onSave={onSaveRecipe ? () => onSaveRecipe(recipe) : undefined}
        />
      ))}
    </div>
  )
}
