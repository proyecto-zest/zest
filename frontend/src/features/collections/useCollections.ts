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

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  const removeCollection = (id: string) => {
    setState((current) =>
      current.status === 'ok'
        ? {
            ...current,
            collections: current.collections.filter((collection) => collection.id !== id),
          }
        : current,
    )
  }

  const addCollection = (created: CreatedCollection) => {
    setState((current) => ({
      status: 'ok',
      collections: [
        ...(current.status === 'ok' ? current.collections : []),
        { ...created, recipeCount: 0 },
      ],
    }))
  }

  return { state, retry, removeCollection, addCollection }
}
