import type { CreateRecipePayload } from '../features/recipe-create/payload'
import type { RecipeMetadata } from '../features/recipe-create/types'
import type { PaginatedRecipes, RecipeDetailData } from '../types/recipe'
import type { QueryParams } from './buildQuery'
import { httpClient } from './httpClient'

/** Enum options for the recipe form (categories, difficulties, units, time units). */
export const getRecipeMetadata = (options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeMetadata>('/recipes/metadata', options)

/** Creates a recipe. Returns the created recipe as sent back by the API. */
export const createRecipe = (payload: CreateRecipePayload) =>
  httpClient.post<{ id: string; title: string }>('/recipes', payload)

export interface ListRecipesParams extends QueryParams {
  page: number
  limit: number
  name?: string
  ingredient?: string[]
  category?: string
  difficulty?: string
}

/** One page of the recipe feed, with optional search filters. `page` is 1-based, matching the API. */
export const listRecipes = (params: ListRecipesParams, options?: { signal?: AbortSignal }) =>
  httpClient.get<PaginatedRecipes>('/recipes', { ...options, query: params })

/** The full recipe for the detail view. 404s (unknown id) surface as `HttpError` with `status: 404`. */
export const getRecipe = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeDetailData>(`/recipes/${id}`, options)
