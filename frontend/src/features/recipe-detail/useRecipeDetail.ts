import { useEffect, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { getRecipe } from '../../services/recipes'
import type { RecipeDetailData } from '../../types/recipe'

export type RecipeDetailState =
  | { status: 'loading' }
  | { status: 'ok'; recipe: RecipeDetailData }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type Result = { id: string } & (
  | { status: 'ok'; recipe: RecipeDetailData }
  | { status: 'notFound' }
  | { status: 'error'; message: string }
)

/**
 * Loads GET /recipes/:id. A 404 from the API becomes its own `notFound`
 * state, distinct from `error`, so the page can show "recipe not found"
 * instead of a generic retry-able error. `retry` re-runs the same id.
 */
export function useRecipeDetail(id: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getRecipe(id, { signal: controller.signal })
      .then((recipe) => setResult({ status: 'ok', id, recipe }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof HttpError && error.status === 404) {
          setResult({ status: 'notFound', id })
          return
        }
        setResult({ status: 'error', id, message: error instanceof Error ? error.message : 'Unknown error' })
      })

    return () => controller.abort()
  }, [id, attempt])

  const state: RecipeDetailState = result && result.id === id ? result : { status: 'loading' }

  return { state, retry: () => setAttempt((n) => n + 1) }
}
