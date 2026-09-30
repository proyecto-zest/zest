import { useAuth0 } from '@auth0/auth0-react'
import { useRoutes } from 'react-router-dom'
import { CurrentUserProvider } from '../auth/CurrentUserProvider'
import { SiteShell } from '../components/nav/SiteShell'
import { routes } from './routes'
import { useScrollRestoration } from './useScrollRestoration'

export function App() {
  const { isLoading, isAuthenticated, user } = useAuth0()
  const element = useRoutes(routes)
  useScrollRestoration()

  return (
    // A new Auth0 identity gets a fresh local-user state; a previous account's
    // profile must never flash while the next /users/me request is loading.
    <CurrentUserProvider key={isAuthenticated ? `user:${user?.sub ?? ''}` : 'guest'}>
      <SiteShell>
        {/* Auth0 is still restoring the session (e.g. right after a page reload) —
            render nothing yet, so `ProtectedRoute` never sees a false "logged out"
            and bounces to login for a user who actually has a valid session. */}
        {isLoading ? null : element}
      </SiteShell>
    </CurrentUserProvider>
  )
}
