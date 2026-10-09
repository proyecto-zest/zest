import type { PaginatedRecipes } from '../types/recipe'
import { listRecipes, type ListRecipesParams } from './recipes'

export type CollectionSearchField = 'name' | 'ingredient'
export type CollectionDifficulty = '' | 'FACIL' | 'MEDIA' | 'DIFICIL'

export interface CollectionRecipeSearchParams {
  field: CollectionSearchField
  query: string
  difficulty: CollectionDifficulty
  page: number
}

/** Reuses GET /recipes; the text-ingredient mapping is isolated until ZEST-98 confirms it. */
export function searchCollectionRecipes(
  { field, query, difficulty, page }: CollectionRecipeSearchParams,
  options?: { signal?: AbortSignal },
): Promise<PaginatedRecipes> {
  const params: ListRecipesParams & { ingredientName?: string } = { page, limit: 20 }
  const text = query.trim()
  if (text) {
    if (field === 'name') params.name = text
    // TODO ZEST-98: confirm the text parameter. Existing `ingredient` takes UUIDs.
    else params.ingredientName = text
  }
  if (difficulty) params.difficulty = difficulty
  return listRecipes(params, options)
}
