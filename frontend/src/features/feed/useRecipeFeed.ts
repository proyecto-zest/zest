import { useEffect, useState } from 'react'
import { listRecipes } from '../../services/recipes'
import type { PaginatedRecipes } from '../../types/recipe'

const PAGE_SIZE = 20

export type RecipeFeedState =
  | { status: 'loading' }
  | { status: 'ok'; data: PaginatedRecipes }
  | { status: 'error'; message: string }

type Result = { page: number } & ({ status: 'ok'; data: PaginatedRecipes } | { status: 'error'; message: string })

/**
 * Loads one page of GET /recipes. `state` is derived from `result` vs the
 * requested `page` rather than reset by an effect, so a stale in-flight
 * request never overwrites a newer one, and changing `page` shows a loading
 * state without a synchronous `setState` inside the effect body. `retry`
 * re-runs the same page after an error.
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

  const state: RecipeFeedState = result && result.page === page ? result : { status: 'loading' }

  return { state, retry: () => setAttempt((n) => n + 1) }
}
