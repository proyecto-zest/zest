/** Recipe enums — the source of truth is the backend; values come from GET /recipes/metadata. */
export type RecipeCategory = string
export type RecipeDifficulty = string
export type RecipeTimeUnit = string
export type IngredientUnit = string

export interface Ingredient {
  id: string
  name: string
}

export interface RecipeMetadata {
  categories: RecipeCategory[]
  difficulties: RecipeDifficulty[]
  units: IngredientUnit[]
  timeUnits: RecipeTimeUnit[]
}

/**
 * One ingredient row in the form. `id` is a client-side key for React lists —
 * it never leaves the browser, so removing a row from the middle doesn't
 * shuffle another row's input values.
 */
export interface IngredientRowValue {
  id: string
  ingredientId: string
  amount: string
  unit: IngredientUnit
}

/** One step row in the form. Same reason for `id` as `IngredientRowValue`. */
export interface StepRowValue {
  id: string
  text: string
}

/** The whole form's state. Numbers are strings while typing; parsed on submit. */
export interface RecipeFormValues {
  title: string
  description: string
  category: RecipeCategory
  time: string
  timeUnit: RecipeTimeUnit
  difficulty: RecipeDifficulty
  servings: string
  ingredients: IngredientRowValue[]
  steps: StepRowValue[]
}
