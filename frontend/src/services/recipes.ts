import type { CreateRecipePayload } from '../features/recipe-create/payload'
import type { RecipeMetadata } from '../features/recipe-create/types'
import { httpClient } from './httpClient'

/** Enum options for the recipe form (categories, difficulties, units, time units). */
export const getRecipeMetadata = (options?: { signal?: AbortSignal }) =>
  httpClient.get<RecipeMetadata>('/recipes/metadata', options)

/** Creates a recipe. Returns the created recipe as sent back by the API. */
export const createRecipe = (payload: CreateRecipePayload) =>
  httpClient.post<{ id: string; title: string }>('/recipes', payload)
