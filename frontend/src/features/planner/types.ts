import type { RecipeCardData } from '../../types/recipe'

/**
 * What the recipe picker hands back: the id POST /planner needs, plus enough
 * to draw the meal right away. Both GET /recipes and GET /collections/:id
 * rows map onto it, so the picker does not care which tab it came from.
 */
export type PickedRecipe = Pick<RecipeCardData, 'id' | 'title' | 'time' | 'timeUnit'> & {
  imageUrl: string | null
}

/** What every list in the picker needs to pick a recipe and show that a save is running. */
export interface PickerSelection {
  /** Recipe being saved right now; its row shows a spinner and every row is disabled. */
  pendingId: string | null
  onSelect: (recipe: PickedRecipe) => void
}
