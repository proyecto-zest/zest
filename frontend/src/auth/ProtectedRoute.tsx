import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Gates a route behind Auth0. Waits for `isLoading` to settle before deciding
 * anything — checking `isAuthenticated` while Auth0 is still restoring the
 * session would flash a login redirect on every reload even when the user has
 * a valid session. The current path (+ query/hash) is stashed in `appState`
 * so `onRedirectCallback` can send the user back here after login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0()
  const location = useLocation()

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    loginWithRedirect({ appState: { returnTo } })
  }, [isLoading, isAuthenticated, loginWithRedirect, location])

  if (!isAuthenticated) return null

  return <>{children}</>
}
