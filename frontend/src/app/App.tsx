import { useAuth0 } from '@auth0/auth0-react'
import { useRoutes } from 'react-router-dom'
import { AuthTokenBridge } from '../auth/AuthTokenBridge'
import { useSyncUserProfile } from '../auth/useSyncUserProfile'
import { SiteShell } from '../components/nav/SiteShell'
import { routes } from './routes'
import { useScrollRestoration } from './useScrollRestoration'

export function App() {
  const { isLoading } = useAuth0()
  const element = useRoutes(routes)
  useScrollRestoration()
  useSyncUserProfile()

  return (
    <SiteShell>
      <AuthTokenBridge />
      {/* Auth0 is still restoring the session (e.g. right after a page reload) —
          render nothing yet, so `ProtectedRoute` never sees a false "logged out"
          and bounces to login for a user who actually has a valid session. */}
      {isLoading ? null : element}
    </SiteShell>
  )
}
