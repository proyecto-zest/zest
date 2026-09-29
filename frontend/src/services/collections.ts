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
