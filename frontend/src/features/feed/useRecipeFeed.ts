import { useEffect, useState } from 'react'
import { listRecipes } from '../../services/recipes'
import type { PaginatedRecipes } from '../../types/recipe'
import type { RecipeSearchFiltersValue } from '../../components/recipe-search-filters'

/** A multiple of 1, 2 and 3 — the grid's mobile/tablet/desktop column counts — so the last row of a page never falls short. */
const PAGE_SIZE = 18

export type RecipeFeedState =
  | { status: 'loading' }
  /** `stale: true` means a new page/filters request is in flight — `data` is still the previous page's, kept on screen instead of swapped for a skeleton. */
  | { status: 'ok'; data: PaginatedRecipes; stale: boolean }
  /** `staleData`, when present, is a previous page's recipes shown (atenuated) behind the error banner instead of the grid vanishing. */
  | { status: 'error'; message: string; staleData?: PaginatedRecipes }

type Key = { page: number; filters: RecipeSearchFiltersValue }
type Result = Key & ({ status: 'ok'; data: PaginatedRecipes } | { status: 'error'; message: string })

const sameFilters = (a: RecipeSearchFiltersValue, b: RecipeSearchFiltersValue) =>
  a.name === b.name &&
  a.category === b.category &&
  a.difficulty === b.difficulty &&
  a.ingredientIds.length === b.ingredientIds.length &&
  a.ingredientIds.every((id, i) => id === b.ingredientIds[i])

/**
 * Loads one page of GET /recipes for the given filters. `state` is derived
 * from `result` vs the requested `page`/`filters` rather than reset by an
 * effect, so a stale in-flight request never overwrites a newer one.
 * `lastGoodData` is tracked separately from `result` so that when a filter
 * change's request fails, the previous page's recipes can still be shown
 * (atenuated) behind the error banner instead of the whole grid flashing
 * away to nothing. `retry` re-runs the same request after an error.
 */
export function useRecipeFeed(page: number, filters: RecipeSearchFiltersValue) {
  const [result, setResult] = useState<Result | null>(null)
  const [lastGoodData, setLastGoodData] = useState<PaginatedRecipes | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listRecipes(
      {
        page,
        limit: PAGE_SIZE,
        name: filters.name || undefined,
        ingredient: filters.ingredientIds.length > 0 ? filters.ingredientIds : undefined,
        category: filters.category || undefined,
        difficulty: filters.difficulty || undefined,
      },
      { signal: controller.signal },
    )
      .then((data) => {
        setResult({ status: 'ok', page, filters, data })
        setLastGoodData(data)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResult({
          status: 'error',
          page,
          filters,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    return () => controller.abort()
    // `filters` is a new object every render (built fresh from URL search params) — depending on
    // its primitive fields instead keeps the effect from re-running (and re-fetching) every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.name, filters.category, filters.difficulty, filters.ingredientIds.join(','), attempt])

  const isCurrent = result !== null && result.page === page && sameFilters(result.filters, filters)

  let state: RecipeFeedState
  if (isCurrent && result) {
    if (result.status === 'ok') {
      state = { status: 'ok', data: result.data, stale: false }
    } else {
      state = { status: 'error', message: result.message, staleData: lastGoodData ?? undefined }
    }
  } else if (lastGoodData) {
    // A new page/filters request is in flight — keep the previous page's recipes on screen
    // (marked stale) instead of swapping them for a skeleton, so the grid never goes empty.
    state = { status: 'ok', data: lastGoodData, stale: true }
  } else {
    state = { status: 'loading' }
  }

  return { state, retry: () => setAttempt((n) => n + 1) }
}
