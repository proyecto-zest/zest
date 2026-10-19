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

/**
 * The signed-in user's entries between two days, both inclusive.
 * Assumes GET /planner returns the same shape as POST /planner.
 */
export const listPlannerEntries = (from: string, to: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<PlannerEntry[]>('/planner', { ...options, query: { from, to } })
