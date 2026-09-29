import { httpClient } from './httpClient'

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

export interface CreateCollectionPayload {
  name: string
  coverImageUrl: string
  accentColor: string
}

/** POST /collections currently returns these four fields (without a recipe count). */
export type CreatedCollection = Pick<
  CollectionSummary,
  'id' | 'name' | 'coverImageUrl' | 'accentColor'
>

export const createCollection = (payload: CreateCollectionPayload) =>
  httpClient.post<CreatedCollection>('/collections', payload)
