import { httpClient } from './httpClient'

/** One planned meal — mirrors the backend's `PlannerEntryResponseDto` (ZEST-119). */
export interface PlannerEntry {
  id: string
  /** Calendar day as `YYYY-MM-DD`, with no time or timezone. */
  date: string
  quantity: number
  recipeId: string
  title: string
  imageUrl: string | null
  time: number
  timeUnit: string
}

/** The signed-in user's entries between two days, both inclusive (GET /planner, ZEST-122). */
export const listPlannerEntries = (from: string, to: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<PlannerEntry[]>('/planner', { ...options, query: { from, to } })

export interface CreatePlannerEntryPayload {
  recipeId: string
  /** `YYYY-MM-DD` */
  date: string
  /** 1 to 100; planning the same recipe on the same day again adds to it. */
  quantity: number
}

/** Plans a recipe on a day (POST /planner, ZEST-119). */
export const createPlannerEntry = (payload: CreatePlannerEntryPayload) =>
  httpClient.post<PlannerEntry>('/planner', payload)

/** Removes one planned meal (DELETE /planner/:id, ZEST-123): 404 if it is gone, 403 if it is not the user's. */
export const deletePlannerEntry = (id: string) =>
  httpClient.delete<void>(`/planner/${encodeURIComponent(id)}`)
