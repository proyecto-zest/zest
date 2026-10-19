import type { RecipeCardData } from '../../types/recipe'

/**
 * What the recipe picker hands back: the id POST /planner needs, plus enough
 * to draw the meal right away. Both GET /recipes and GET /collections/:id
 * rows map onto it, so the picker does not care which tab it came from.
 */
export type PickedRecipe = Pick<RecipeCardData, 'id' | 'title' | 'time' | 'timeUnit'> & {
  imageUrl: string | null
}
