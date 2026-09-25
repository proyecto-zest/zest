import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { syncCurrentUser } from '../services/users'
import type { CurrentUserData } from '../types/user'
import { CurrentUserContext } from './currentUserContext'

interface CurrentUserProviderProps {
  children: ReactNode
  /** ZEST-32 will supply the validated Auth0 `sub` once its provider is merged. */
  auth0Sub?: string | null
}

/**
 * Owns the single GET /users/me synchronization and keeps its result available
 * to every screen. Profile consumers reuse this value instead of fetching it
 * again.
 */
export function CurrentUserProvider({ children, auth0Sub = null }: CurrentUserProviderProps) {
  const [user, setUser] = useState<CurrentUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    syncCurrentUser({ signal: controller.signal })
      .then((syncedUser) => {
        setUser(syncedUser)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Could not load your profile.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const value = useMemo(
    () => ({ user, auth0Sub, loading, error, replaceUser: setUser }),
    [user, auth0Sub, loading, error],
  )

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
}
