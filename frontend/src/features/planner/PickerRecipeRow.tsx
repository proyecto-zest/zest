import { RecipeImage } from '../../components/RecipeImage'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import { PickerRow } from './PickerRow'
import type { PickedRecipe, PickerSelection } from './types'

interface PickerRecipeRowProps {
  recipe: PickedRecipe
  selection: PickerSelection
}

export function PickerRecipeRow({ recipe, selection }: PickerRecipeRowProps) {
  return (
    <PickerRow
      title={recipe.title}
      subtitle={formatRecipeTime(recipe.time, recipe.timeUnit)}
      thumbnail={<RecipeImage src={recipe.imageUrl ?? undefined} alt="" />}
      action="add"
      aria-label={`Add ${recipe.title}`}
      pending={selection.pendingId === recipe.id}
      disabled={selection.pendingId !== null}
      onClick={() => selection.onSelect(recipe)}
    />
  )
}
