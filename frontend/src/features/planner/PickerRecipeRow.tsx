import { RecipeImage } from '../../components/RecipeImage'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import { PickerRow } from './PickerRow'
import type { PickedRecipe } from './types'

interface PickerRecipeRowProps {
  recipe: PickedRecipe
  onSelect: (recipe: PickedRecipe) => void
}

export function PickerRecipeRow({ recipe, onSelect }: PickerRecipeRowProps) {
  return (
    <PickerRow
      title={recipe.title}
      subtitle={formatRecipeTime(recipe.time, recipe.timeUnit)}
      thumbnail={<RecipeImage src={recipe.imageUrl ?? undefined} alt="" />}
      action="add"
      aria-label={`Add ${recipe.title}`}
      onClick={() => onSelect(recipe)}
    />
  )
}
