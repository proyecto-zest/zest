import { useEffect, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { getPublicUser } from '../../services/users'
import type { PublicUserData } from '../../types/user'

type PublicUserState =
  | { status: 'loading' }
  | { status: 'ok'; user: PublicUserData }
  | { status: 'notFound' }
  | { status: 'error'; message: string }

type Result = { id: string } & Exclude<PublicUserState, { status: 'loading' }>

/** Loads the safe public user DTO without exposing private profile fields. */
export function usePublicUser(id: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getPublicUser(id, { signal: controller.signal })
      .then((user) => setResult({ status: 'ok', id, user }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof HttpError && error.status === 404) {
          setResult({ status: 'notFound', id })
          return
        }
        setResult({
          status: 'error',
          id,
          message: error instanceof Error ? error.message : 'Could not load this user.',
        })
      })

    return () => controller.abort()
  }, [id, attempt])

  const state: PublicUserState = result?.id === id ? result : { status: 'loading' }
  const retry = () => {
    setResult(null)
    setAttempt((value) => value + 1)
  }

  return { state, retry }
}
