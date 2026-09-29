import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { syncCurrentUser } from '../services/users'
import type { CurrentUserData } from '../types/user'
import { CurrentUserContext } from './currentUserContext'

interface CurrentUserProviderProps {
  children: ReactNode
}

/**
 * Owns the single GET /users/me synchronization and keeps its result available
 * to every screen. Profile consumers reuse this value instead of fetching it
 * again.
 */
export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const { isLoading: authLoading, isAuthenticated, user: auth0User } = useAuth0()
  const auth0Sub = auth0User?.sub ?? null
  const [result, setResult] = useState<
    { status: 'ok'; user: CurrentUserData } | { status: 'error'; message: string } | null
  >(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    const controller = new AbortController()

    syncCurrentUser({ signal: controller.signal })
      .then((syncedUser) => {
        if (!controller.signal.aborted) setResult({ status: 'ok', user: syncedUser })
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Could not load your profile.',
          })
        }
      })

    return () => controller.abort()
  }, [authLoading, isAuthenticated, auth0Sub])

  const user = isAuthenticated && result?.status === 'ok' ? result.user : null
  const loading = authLoading || (isAuthenticated && result === null)
  const error = isAuthenticated && result?.status === 'error' ? result.message : null

  const value = useMemo(
    () => ({
      user,
      auth0Sub: isAuthenticated ? auth0Sub : null,
      loading,
      error,
      replaceUser: (updatedUser: CurrentUserData) => setResult({ status: 'ok', user: updatedUser }),
    }),
    [user, isAuthenticated, auth0Sub, loading, error],
  )

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
}
