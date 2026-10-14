import { useEffect, useState } from 'react'
import { getCollection, type CollectionDetail } from '../../services/collections'
import { HttpError } from '../../services/httpClient'

type CollectionDetailState =
  | { status: 'loading' }
  | { status: 'ok'; collection: CollectionDetail }
  | { status: 'notFound' }
  | { status: 'error'; message: string; retryable: boolean }

type Result = { id: string } & Exclude<CollectionDetailState, { status: 'loading' }>

/** Fetches one collection; refresh keeps the current content while membership changes are read. */
export function useCollectionDetail(id: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getCollection(id, { signal: controller.signal })
      .then((collection) => {
        if (!controller.signal.aborted) setResult({ status: 'ok', id, collection })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof HttpError && (error.status === 400 || error.status === 404)) {
          setResult({ status: 'notFound', id })
          return
        }
        setResult({
          status: 'error',
          id,
          message: error instanceof Error ? error.message : 'Could not load the collection.',
          retryable: !(error instanceof HttpError) || error.status >= 500,
        })
      })
    return () => controller.abort()
  }, [id, attempt])

  const state: CollectionDetailState = result?.id === id ? result : { status: 'loading' }
  const refresh = () => setAttempt((value) => value + 1)
  const retry = () => {
    setResult(null)
    refresh()
  }

  return { state, retry, refresh }
}
