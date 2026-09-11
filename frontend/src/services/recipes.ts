import type { CreateRecipePayload } from '../features/recipe-create/payload'
import type { RecipeMetadata } from '../features/recipe-create/types'
import type { PaginatedRecipes, RecipeDetailData } from '../types/recipe'
import { httpClient } from './httpClient'

/** Enum options for the recipe form (categories, difficulties, units, time units). */
export const getRecipeMetadata = (options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeMetadata>('/recipes/metadata', options)

/** Creates a recipe. Returns the created recipe as sent back by the API. */
export const createRecipe = (payload: CreateRecipePayload) =>
  httpClient.post<{ id: string; title: string }>('/recipes', payload)

/** One page of the recipe feed. `page` is 1-based, matching the API. */
export const listRecipes = (params: { page: number; limit: number }, options?: { signal?: AbortSignal }) =>
  httpClient.get<PaginatedRecipes>('/recipes', { ...options, query: params })

/** Deletes a recipe. The API responds 204 No Content on success. */
export const deleteRecipe = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.delete(`/recipes/${id}`, options)

/** The full recipe for the detail view. 404s (unknown id) surface as `HttpError` with `status: 404`. */
export const getRecipe = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeDetailData>(`/recipes/${id}`, options)
