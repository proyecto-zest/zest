import { useAuth0 } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Gates a route behind Auth0. Waits for `isLoading` to settle before deciding
 * anything — checking `isAuthenticated` while Auth0 is still restoring the
 * session would flash a login redirect on every reload even when the user has
 * a valid session. Without a session, this renders our own `/login` (per the
 * design) instead of calling `loginWithRedirect` directly — that would skip
 * straight to Universal Login and, since `/` is itself protected, trap an
 * Auth0 error (e.g. declining consent) in a redirect loop that never reaches
 * a page where `AuthError` can show it. `returnTo` travels in router state so
 * `AuthActionButton` can hand it to `loginWithRedirect`'s `appState` and land
 * back here after a real login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth0()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ returnTo }} replace />
  }

  return <>{children}</>
}
