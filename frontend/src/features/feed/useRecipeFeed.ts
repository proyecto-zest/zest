import { useEffect, useState } from 'react'
import { listRecipes } from '../../services/recipes'
import type { PaginatedRecipes, RecipePagination } from '../../types/recipe'

/** A multiple of 1, 2 and 3 — the grid's mobile/tablet/desktop column counts — so the last row of a page never falls short. */
const PAGE_SIZE = 18

/** Cold-start skeleton count: nothing is known about the feed yet, so this is just a plausible first screenful. */
const INITIAL_SKELETON_COUNT = 6

export type RecipeFeedState =
  | { status: 'loading'; skeletonCount: number }
  | { status: 'ok'; data: PaginatedRecipes }
  /**
   * A page change is in flight. `data` is the page being left — its `pagination`
   * is still valid, so the header count and the pagination controls stay put —
   * while `skeletonCount` is how many cards the incoming page will have, so the
   * grid can hold exactly the right amount of space instead of showing the old
   * page's cards and then collapsing to a shorter one.
   */
  | { status: 'switchingPage'; data: PaginatedRecipes; skeletonCount: number }
  | { status: 'error'; message: string }

type Result = { page: number } & ({ status: 'ok'; data: PaginatedRecipes } | { status: 'error'; message: string })

/** How many recipes a given page holds, from the pagination metadata of any page of the same feed. */
const countForPage = (pagination: RecipePagination, page: number) =>
  Math.max(0, Math.min(pagination.limit, pagination.total - (page - 1) * pagination.limit))

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
    state = result.status === 'ok' ? { status: 'ok', data: result.data } : result
  } else if (result?.status === 'ok') {
    state = {
      status: 'switchingPage',
      data: result.data,
      skeletonCount: countForPage(result.data.pagination, page),
    }
  } else {
    state = { status: 'loading', skeletonCount: INITIAL_SKELETON_COUNT }
  }

  /** Drops a deleted recipe from the current page's in-memory data — no refetch needed. */
  const removeRecipe = (id: string) => {
    setResult((prev) => {
      if (!prev || prev.status !== 'ok') return prev
      const total = prev.data.pagination.total - 1
      return {
        ...prev,
        data: {
          ...prev.data,
          recipes: prev.data.recipes.filter((recipe) => recipe.id !== id),
          pagination: {
            ...prev.data.pagination,
            total,
            totalPages: Math.max(1, Math.ceil(total / prev.data.pagination.limit)),
          },
        },
      }
    })
  }

  return { state, retry: () => setAttempt((n) => n + 1), removeRecipe }
}
