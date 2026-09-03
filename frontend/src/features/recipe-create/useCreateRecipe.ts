import { useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { createRecipe } from '../../services/recipes'
import type { CreateRecipePayload } from './payload'

export type CreateRecipeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; messages: string[] }
  | { status: 'success'; title: string }

/** Submits POST /recipes and tracks the request's loading/error/success state. */
export function useCreateRecipe() {
  const [state, setState] = useState<CreateRecipeState>({ status: 'idle' })

  const submit = async (payload: CreateRecipePayload): Promise<boolean> => {
    setState({ status: 'loading' })
    try {
      const recipe = await createRecipe(payload)
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
