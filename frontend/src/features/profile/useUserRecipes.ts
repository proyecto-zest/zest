import { useEffect, useState } from 'react'
import { listRecipes } from '../../services/recipes'
import type { PaginatedRecipes } from '../../types/recipe'

const PAGE_SIZE = 18

type UserRecipesState =
  | { status: 'loading' }
  | { status: 'ok'; data: PaginatedRecipes }
  | { status: 'error'; message: string }

type Result = { userId: string; page: number } & Exclude<UserRecipesState, { status: 'loading' }>

/** Paginated recipe list for one author; reusable by own and public profiles. */
export function useUserRecipes(userId: string, page: number) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listRecipes({ page, limit: PAGE_SIZE, authorId: userId }, { signal: controller.signal })
      .then((data) => setResult({ status: 'ok', userId, page, data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResult({
          status: 'error',
          userId,
          page,
          message: error instanceof Error ? error.message : 'Could not load recipes.',
        })
      })

    return () => controller.abort()
  }, [userId, page, attempt])

  const state: UserRecipesState =
    result?.userId === userId && result.page === page ? result : { status: 'loading' }

  const removeRecipe = (id: string) => {
    setResult((previous) => {
      if (!previous || previous.status !== 'ok') return previous
      const total = previous.data.pagination.total - 1
      return {
        ...previous,
        status: 'ok',
        data: {
          recipes: previous.data.recipes.filter((recipe) => recipe.id !== id),
          pagination: {
            ...previous.data.pagination,
            total,
            totalPages: Math.max(1, Math.ceil(total / previous.data.pagination.limit)),
          },
        },
      }
    })
  }

  return { state, retry: () => setAttempt((value) => value + 1), removeRecipe }
}
