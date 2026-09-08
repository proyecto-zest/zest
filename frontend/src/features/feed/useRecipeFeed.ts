import { useEffect, useState } from 'react'
import { listRecipes } from '../../services/recipes'
import type { PaginatedRecipes } from '../../types/recipe'

/** A multiple of 1, 2 and 3 — the grid's mobile/tablet/desktop column counts — so the last row of a page never falls short. */
const PAGE_SIZE = 18

export type RecipeFeedState =
  | { status: 'loading' }
  /** `stale: true` means a new page is in flight — `data` is still the previous page's, kept on screen instead of swapped for a skeleton. */
  | { status: 'ok'; data: PaginatedRecipes; stale: boolean }
  | { status: 'error'; message: string }

type Result = { page: number } & ({ status: 'ok'; data: PaginatedRecipes } | { status: 'error'; message: string })

/**
 * Loads one page of GET /recipes. `state` is derived from `result` vs the
 * requested `page` rather than reset by an effect, so a stale in-flight
 * request never overwrites a newer one. `retry` re-runs the same page after
 * an error.
 */
export function useRecipeFeed(page: number) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listRecipes({ page, limit: PAGE_SIZE }, { signal: controller.signal })
      .then((data) => setResult({ status: 'ok', page, data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResult({ status: 'error', page, message: error instanceof Error ? error.message : 'Unknown error' })
      })

    return () => controller.abort()
  }, [page, attempt])

  const isCurrent = result !== null && result.page === page

  let state: RecipeFeedState
  if (isCurrent && result) {
    state = result.status === 'ok' ? { status: 'ok', data: result.data, stale: false } : result
  } else if (result?.status === 'ok') {
    // A new page request is in flight — keep the previous page's recipes on screen
    // (marked stale) instead of swapping them for a skeleton, so the grid never goes empty.
    state = { status: 'ok', data: result.data, stale: true }
  } else {
    state = { status: 'loading' }
  }

  return { state, retry: () => setAttempt((n) => n + 1) }
}
