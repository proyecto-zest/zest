import type { CreateRecipePayload } from './payload'
import type { RecipeFormValues } from './types'

/** Turns validated form state into the body POST /recipes expects. */
export function buildCreateRecipePayload(values: RecipeFormValues): CreateRecipePayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    time: Number(values.time),
    timeUnit: values.timeUnit,
    difficulty: values.difficulty,
    servings: Number(values.servings),
    ingredients: values.ingredients.map(({ ingredientId, amount, unit }) => ({
      ingredientId,
      amount: amount.trim(),
      unit,
    })),
    steps: values.steps.map((step) => step.text.trim()),
  }
}
