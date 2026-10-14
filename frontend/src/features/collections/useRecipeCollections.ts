import { useEffect, useState } from 'react'
import { listRecipeCollections, type RecipeCollectionSummary } from '../../services/collections'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; collections: RecipeCollectionSummary[] }

export function useRecipeCollections(recipeId: string) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    listRecipeCollections(recipeId, { signal: controller.signal })
      .then((collections) => {
        if (!controller.signal.aborted) setState({ status: 'ok', collections })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load collections.',
          })
      })
    return () => controller.abort()
  }, [recipeId, attempt])
  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }
  const setMembership = (id: string, containsRecipe: boolean) => {
    setState((current) =>
      current.status === 'ok'
        ? {
            ...current,
            collections: current.collections.map((collection) =>
              collection.id === id
                ? {
                    ...collection,
                    containsRecipe,
                    recipeCount: collection.recipeCount + (containsRecipe ? 1 : -1),
                  }
                : collection,
            ),
          }
        : current,
    )
  }
  return { state, retry, setMembership }
}
