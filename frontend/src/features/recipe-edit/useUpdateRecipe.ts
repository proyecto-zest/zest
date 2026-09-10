import { useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { updateRecipe } from '../../services/recipes'
import type { CreateRecipePayload } from '../recipe-create/payload'

export type UpdateRecipeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; messages: string[] }
  | { status: 'success'; title: string }

/** Submits PUT /recipes/:id and tracks the request's loading/error/success state. */
export function useUpdateRecipe(id: string) {
  const [state, setState] = useState<UpdateRecipeState>({ status: 'idle' })

  const submit = async (payload: CreateRecipePayload): Promise<boolean> => {
    setState({ status: 'loading' })
    try {
      const recipe = await updateRecipe(id, payload)
      setState({ status: 'success', title: recipe.title })
      return true
    } catch (error) {
      const messages = error instanceof HttpError ? error.messages : ['Something went wrong.']
      setState({ status: 'error', messages })
      return false
    }
  }

  return { state, submit, reset: () => setState({ status: 'idle' }) }
}
