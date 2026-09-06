/**
 * The list projection GET /recipes returns for one recipe — mirrors the
 * backend's `RecipeCardResponseDto`. Lighter than a full recipe: no
 * description, ingredients or steps. Shared across feed, search, collections
 * and the planner, so it lives outside any single `features/*` folder.
 */
export interface RecipeCardData {
  id: string
  title: string
  imageUrls: string[]
  category: string
  difficulty: string
  time: number
  servings: number
}

export interface RecipePagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedRecipes {
  recipes: RecipeCardData[]
  pagination: RecipePagination
}

/** One row of `RecipeDetailData.ingredients` — mirrors `RecipeIngredientResponseDto`. */
export interface RecipeIngredientData {
  ingredientId: string
  amount: string
  unit: string
  ingredient: { id: string; name: string }
}

/** One row of `RecipeDetailData.steps` — mirrors `RecipeStepResponseDto`. */
export interface RecipeStepData {
  id: string
  stepNumber: number
  text: string
}

/** The full recipe GET /recipes/:id returns — mirrors `RecipeDetailResponseDto`. */
export interface RecipeDetailData {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  time: number
  timeUnit: string
  servings: number
  imageUrls: string[]
  ingredients: RecipeIngredientData[]
  steps: RecipeStepData[]
}
