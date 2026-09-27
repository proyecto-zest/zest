import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { httpClient } from '../services/httpClient'

/**
 * Fires `GET /users/me` once per session, right after Auth0 confirms the user
 * is authenticated. The backend links the Auth0 identity to a local `users`
 * row on that first call — skip it and the user exists in Auth0 but not in
 * Zest, so anything behind `@CurrentUser()` 401s. `getAccessTokenSilently`
 * failing here (expired/invalid session) is handled by the http client's own
 * interceptor, which sends the user back to login — this hook doesn't need to
 * catch that itself.
 */
export function useSyncUserProfile() {
  const { isLoading, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    httpClient.get('/users/me').catch(() => {
      // Swallowed here: a real failure (network, 5xx) shouldn't block
      // rendering the rest of the app, and an auth failure already redirected.
    })
  }, [isLoading, isAuthenticated])
}
