import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface RedirectIfAuthenticatedProps {
  children: ReactNode
}

/**
 * Gates `/login` and `/signup`: an already-authenticated visitor has no
 * reason to see them, so send them to the feed instead. Waits for `isLoading`
 * to settle first, same as `ProtectedRoute` — deciding while Auth0 is still
 * restoring the session would flash these pages even for a logged-in user.
 */
export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const { isLoading, isAuthenticated } = useAuth0()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  return <>{children}</>
}
