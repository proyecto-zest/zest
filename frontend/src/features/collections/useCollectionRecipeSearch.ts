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
  | { status: 'error'; message: string; retryable: boolean }

type Result = { key: string } & Exclude<SearchState, { status: 'loading' }>

/** Debounces text input and cancels stale requests when a filter or page changes. */
export function useCollectionRecipeSearch({
  field,
  query,
  difficulty,
  page,
}: CollectionRecipeSearchParams) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)
  const text = query.trim()
  const key = JSON.stringify({ field, query: text, difficulty, page })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(
      () => {
        searchCollectionRecipes(
          { field, query: text, difficulty, page },
          { signal: controller.signal },
        )
          .then((data) => {
            if (!controller.signal.aborted) setResult({ status: 'ok', key, data })
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
  }, [field, text, difficulty, page, key, attempt])

  const state: SearchState = result?.key === key ? result : { status: 'loading' }
  const retry = () => {
    setResult(null)
    setAttempt((value) => value + 1)
  }
  return { state, retry }
}
