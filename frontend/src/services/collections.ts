import { httpClient } from './httpClient'
import type { CollectionRecipeCardData } from '../types/recipe'

/** Expected list DTO for GET /collections; the list endpoint is still pending in the backend. */
export interface CollectionSummary {
  id: string
  name: string
  coverImageUrl: string | null
  accentColor: string
  recipeCount: number
}

export const listCollections = (options?: { signal?: AbortSignal }) =>
  httpClient.get<CollectionSummary[]>('/collections', options)

export interface CollectionDetail extends Omit<CollectionSummary, 'recipeCount'> {
  recipes: CollectionRecipeCardData[]
}

export const getCollection = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<CollectionDetail>(`/collections/${encodeURIComponent(id)}`, options)

/** ZEST-90: only the membership row is added; the recipe may belong to another user. */
export const addRecipeToCollection = (collectionId: string, recipeId: string) =>
  httpClient.post<void>(`/collections/${encodeURIComponent(collectionId)}/recipes`, {
    recipe_id: recipeId,
  })

/** Deletes only the collection and its membership rows, leaving recipes intact. */
export const deleteCollection = (id: string) => httpClient.delete<void>(`/collections/${id}`)
export interface CreateCollectionPayload {
  name: string
  coverImageKey?: string
  accentColor: string
}

/** POST /collections currently returns these four fields (without a recipe count). */
export type CreatedCollection = Pick<
  CollectionSummary,
  'id' | 'name' | 'coverImageUrl' | 'accentColor'
>

export const createCollection = (payload: CreateCollectionPayload) =>
  httpClient.post<CreatedCollection>('/collections', payload)
