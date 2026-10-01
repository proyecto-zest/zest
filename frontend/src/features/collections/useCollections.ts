import { useEffect, useState } from 'react'
import {
  listCollections,
  type CollectionSummary,
  type CreatedCollection,
} from '../../services/collections'

export type CollectionsState =
  | { status: 'loading' }
  | { status: 'ok'; collections: CollectionSummary[] }
  | { status: 'error'; message: string }

/** Loads the current user's collections. Retry starts a fresh request. */
export function useCollections() {
  const [state, setState] = useState<CollectionsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listCollections({ signal: controller.signal })
      .then((collections) => setState({ status: 'ok', collections }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    return () => controller.abort()
  }, [attempt])

  const addCollection = (created: CreatedCollection) => {
    // A successful creation does not mean we have loaded the complete list.
    // Keep any list error visible until a fresh GET actually succeeds.
    if (state.status !== 'ok') {
      setAttempt((value) => value + 1)
      return
    }

    setState((current) =>
      current.status === 'ok'
        ? { status: 'ok', collections: [...current.collections, { ...created, recipeCount: 0 }] }
        : current,
    )
  }

  return { state, retry: () => setAttempt((value) => value + 1), addCollection }
}
