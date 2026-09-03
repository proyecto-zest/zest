import type { Ingredient } from '../features/recipe-create/types'
import { httpClient } from './httpClient'

/** The ingredient catalog, for the recipe form's ingredient picker. */
export const getIngredients = (options?: { signal?: AbortSignal }) =>
  httpClient.get<Ingredient[]>('/ingredients', options)
