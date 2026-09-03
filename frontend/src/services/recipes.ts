import type { CreateRecipePayload } from '../features/recipe-create/payload'
import type { RecipeMetadata } from '../features/recipe-create/types'
import type { PaginatedRecipes } from '../types/recipe'
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
