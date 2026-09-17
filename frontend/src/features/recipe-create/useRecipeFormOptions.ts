import { useEffect, useState } from 'react'
import { getIngredients } from '../../services/ingredients'
import { getRecipeMetadata } from '../../services/recipes'
import type { Ingredient, RecipeMetadata } from './types'

export type RecipeFormOptionsState =
  | { status: 'loading' }
  | { status: 'ok'; ingredients: Ingredient[]; metadata: RecipeMetadata }
  | { status: 'error'; message: string }

/** Loads the ingredient catalog and the enum options the form needs to render. */
export function useRecipeFormOptions(): RecipeFormOptionsState {
  const [state, setState] = useState<RecipeFormOptionsState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getIngredients({ signal: controller.signal }),
      getRecipeMetadata({ signal: controller.signal }),
    ])
      .then(([ingredients, metadata]) => setState({ status: 'ok', ingredients, metadata }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
