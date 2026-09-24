import { useEffect, useState } from 'react'
import { getCurrentUser } from '../services/users'
import type { CurrentUserData } from '../types/user'

/**
 * Resolves the local Zest user when a recipe screen mounts. ZEST-32 owns
 * restoring the Auth0 session before protected screens render and attaching
 * its token to httpClient. A missing session fails closed: ownership-only
 * controls remain hidden.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCurrentUser({ signal: controller.signal })
      .then(setUser)
      .catch(() => {
        if (!controller.signal.aborted) setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { user, isLoading }
}
