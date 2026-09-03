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
