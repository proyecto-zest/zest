import type { IngredientUnit, RecipeCategory, RecipeDifficulty, RecipeTimeUnit } from './types'

/** One ingredient entry as POST /recipes expects it — no client-side `id`. */
export interface CreateRecipeIngredientPayload {
  ingredientId: string
  amount: string
  unit: IngredientUnit
}

/** The body POST /recipes expects. */
export interface CreateRecipePayload {
  title: string
  description: string
  category: RecipeCategory
  time: number
  timeUnit: RecipeTimeUnit
  difficulty: RecipeDifficulty
  servings: number
  ingredients: CreateRecipeIngredientPayload[]
  steps: string[]
  /** S3 keys of images already uploaded from the client. Omitted when there's no image. */
  imageKeys?: string[]
}
