import type { CollectionRecipeSearchParams } from '../../services/collectionRecipeSearch'
import type { RecipeCardData } from '../../types/recipe'

/**
 * What the recipe picker hands back: the id POST /planner needs, plus enough
 * to draw the meal right away. Both GET /recipes and GET /collections/:id
 * rows map onto it, so the picker does not care which tab it came from.
 */
export type PickedRecipe = Pick<RecipeCardData, 'id' | 'title' | 'time' | 'timeUnit'> & {
  imageUrl: string | null
}

/** Filters and page of the Recipes list. Owned by `RecipePicker` so they survive a tab switch. */
export type PickerSearch = CollectionRecipeSearchParams

/** Copies only the contract fields, so extra data on the source row (author, category…) never reaches `onSelect`. */
export function toPickedRecipe(
  { id, title, time, timeUnit }: Omit<PickedRecipe, 'imageUrl'>,
  imageUrl: string | null,
): PickedRecipe {
  return { id, title, time, timeUnit, imageUrl }
}
