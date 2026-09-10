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

/** The full recipe for the detail/edit views. 404s (unknown id) surface as `HttpError` with `status: 404`. */
export const getRecipe = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeDetailData>(`/recipes/${id}`, options)

/** Updates a recipe with the full payload — same shape as create (PUT /recipes/:id extends the create DTO). */
export const updateRecipe = (id: string, payload: CreateRecipePayload) =>
  httpClient.put<RecipeDetailData>(`/recipes/${id}`, payload)
