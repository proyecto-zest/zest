import type { RecipeFormValues } from './types'

/** Client-side validation. Returns an empty array when the form is valid. */
export function validateRecipeForm(values: RecipeFormValues): string[] {
  const errors: string[] = []

  if (!values.title.trim()) errors.push('Title is required.')
  if (!values.description.trim()) errors.push('Description is required.')
  if (!values.category) errors.push('Category is required.')
  if (!values.time.trim() || Number(values.time) < 1) errors.push('Time must be at least 1.')
  if (!values.timeUnit) errors.push('Time unit is required.')
  if (!values.difficulty) errors.push('Difficulty is required.')
  if (!values.servings.trim() || Number(values.servings) < 1) {
    errors.push('Servings must be at least 1.')
  }

  values.ingredients.forEach((row, index) => {
    if (!row.ingredientId) errors.push(`Ingredient #${index + 1}: pick an ingredient.`)
    if (!row.amount.trim()) errors.push(`Ingredient #${index + 1}: amount is required.`)
    if (!row.unit) errors.push(`Ingredient #${index + 1}: pick a unit.`)
  })

  values.steps.forEach((row, index) => {
    if (!row.text.trim()) errors.push(`Step #${index + 1} is empty.`)
  })

  return errors
}
