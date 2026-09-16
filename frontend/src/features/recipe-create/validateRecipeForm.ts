import {
  DESCRIPTION_MAX_LENGTH,
  INGREDIENT_AMOUNT_MAX_LENGTH,
  STEP_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  servingsRangeError,
  timeRangeError,
} from './fieldLimits'
import type { RecipeFormValues } from './types'

/**
 * Client-side validation. Returns an empty array when the form is valid.
 * The `maxLength` attributes already stop the length checks from being reachable
 * through normal typing — they stay here as a safety net (e.g. programmatic state).
 */
export function validateRecipeForm(values: RecipeFormValues): string[] {
  const errors: string[] = []

  if (!values.title.trim()) errors.push('Title is required.')
  if (values.title.length > TITLE_MAX_LENGTH) errors.push(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`)
  if (!values.description.trim()) errors.push('Description is required.')
  if (values.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`)
  }
  if (!values.category) errors.push('Category is required.')
  if (!values.time.trim() || Number(values.time) < 1) errors.push('Time must be at least 1.')
  const timeError = timeRangeError(values.time, values.timeUnit)
  if (timeError) errors.push(timeError)
  if (!values.timeUnit) errors.push('Time unit is required.')
  if (!values.difficulty) errors.push('Difficulty is required.')
  if (!values.servings.trim() || Number(values.servings) < 1) {
    errors.push('Servings must be at least 1.')
  }
  const servingsError = servingsRangeError(values.servings)
  if (servingsError) errors.push(servingsError)

  if (values.ingredients.length === 0) errors.push('Add at least one ingredient.')
  values.ingredients.forEach((row, index) => {
    if (!row.ingredientId) errors.push(`Ingredient #${index + 1}: pick an ingredient.`)
    if (!row.amount.trim()) errors.push(`Ingredient #${index + 1}: amount is required.`)
    if (row.amount.length > INGREDIENT_AMOUNT_MAX_LENGTH) {
      errors.push(`Ingredient #${index + 1}: amount must be ${INGREDIENT_AMOUNT_MAX_LENGTH} characters or fewer.`)
    }
    if (!row.unit) errors.push(`Ingredient #${index + 1}: pick a unit.`)
  })

  if (values.steps.length === 0) errors.push('Add at least one step.')
  values.steps.forEach((row, index) => {
    if (!row.text.trim()) errors.push(`Step #${index + 1} is empty.`)
    if (row.text.length > STEP_MAX_LENGTH) {
      errors.push(`Step #${index + 1} must be ${STEP_MAX_LENGTH} characters or fewer.`)
    }
  })

  return errors
}
