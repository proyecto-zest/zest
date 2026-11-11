import { useEffect, useState } from 'react'
import {
  searchCollectionRecipes,
  type CollectionRecipeSearchParams,
} from '../../services/collectionRecipeSearch'
import { HttpError } from '../../services/httpClient'
import type { PaginatedRecipes } from '../../types/recipe'

type SearchState =
  | { status: 'loading' }
  | { status: 'ok'; data: PaginatedRecipes }
  /** The search changed and its results are in flight: `data` is the last good result, shown dimmed. */
  | { status: 'searching'; data: PaginatedRecipes }
  | { status: 'error'; message: string; retryable: boolean }

type Result = { key: string } & Exclude<SearchState, { status: 'loading' | 'searching' }>

/** Debounces text input and cancels stale requests when a filter or page changes. */
export function useCollectionRecipeSearch({
  field,
  query,
  difficulty,
  page,
}: CollectionRecipeSearchParams) {
  const [result, setResult] = useState<Result | null>(null)
  const [lastGood, setLastGood] = useState<{ search: string; data: PaginatedRecipes } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const text = query.trim()
  const search = JSON.stringify({ field, query: text, difficulty })
  const key = JSON.stringify({ search, page })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(
      () => {
        searchCollectionRecipes(
          { field, query: text, difficulty, page },
          { signal: controller.signal },
        )
          .then((data) => {
            if (controller.signal.aborted) return
            setResult({ status: 'ok', key, data })
            setLastGood({ search, data })
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return
            setResult({
              status: 'error',
              key,
              message: error instanceof Error ? error.message : 'Could not search recipes.',
              retryable: !(error instanceof HttpError) || error.status >= 500,
            })
          })
      },
      text ? 300 : 0,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [field, text, difficulty, page, search, key, attempt])

  // A page change keeps the skeletons; only a new search keeps the previous rows on screen,
  // and only if there were any (an empty previous result would leave a blank list).
  const state: SearchState =
    result?.key === key
      ? result
      : lastGood && lastGood.search !== search && lastGood.data.recipes.length > 0
        ? { status: 'searching', data: lastGood.data }
        : { status: 'loading' }
  const retry = () => {
    setResult(null)
    setAttempt((value) => value + 1)
  }
  return { state, retry }
}
