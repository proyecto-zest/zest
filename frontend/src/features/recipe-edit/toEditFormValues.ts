import type { RecipeFormValues } from '../recipe-create/types'
import type { RecipeDetailData } from '../../types/recipe'

/** Maps the fetched recipe into the create form's shape, so `useRecipeForm` can prefill from it. */
export function toEditFormValues(recipe: RecipeDetailData): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    time: String(recipe.time),
    timeUnit: recipe.timeUnit,
    difficulty: recipe.difficulty,
    servings: String(recipe.servings),
    ingredients: recipe.ingredients.map((row) => ({
      id: crypto.randomUUID(),
      ingredientId: row.ingredientId,
      amount: row.amount,
      unit: row.unit,
    })),
    steps: recipe.steps.map((step) => ({ id: crypto.randomUUID(), text: step.text })),
  }
}
