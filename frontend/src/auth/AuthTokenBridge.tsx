import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setTokenGetter } from './tokenProvider'

/**
 * Registers `getAccessTokenSilently` with the plain-module token provider so
 * `httpClient` can attach `Authorization` headers without importing React
 * hooks. Renders nothing — mount it once, near the root, inside both
 * `Auth0Provider` and the router.
 */
export function AuthTokenBridge() {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const location = useLocation()

  useEffect(() => {
    setTokenGetter(async () => {
      // No session at all (anonymous visitor on a public route, e.g. the
      // feed) isn't a renewal failure — there's nothing to renew. Only a
      // *previously authenticated* session that can no longer get a token
      // (expired refresh token, revoked session) counts as one.
      if (!isAuthenticated) throw new Error('Not authenticated.')

      try {
        const token = await getAccessTokenSilently()
        if (!token) throw new Error('Auth0 returned no access token.')
        return token
      } catch (error) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`
        await loginWithRedirect({ appState: { returnTo } })
        throw error
      }
    })
    // Re-registering on every navigation is what keeps `returnTo` pointing at
    // the page the user is actually on when a renewal fails mid-session.
  }, [isAuthenticated, getAccessTokenSilently, loginWithRedirect, location])

  return null
}
