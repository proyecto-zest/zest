import { Auth0Provider, type AppState } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

if (!domain || !clientId || !audience) {
  throw new Error(
    'Missing Auth0 env vars. Copy .env.example to .env and fill in VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID and VITE_AUTH0_AUDIENCE.',
  )
}

interface Auth0ProviderWithNavigateProps {
  children: ReactNode
}

/**
 * Wraps `Auth0Provider` with the app's router so a post-login redirect lands
 * back on the route the user was on (`appState.returnTo`, set by whoever calls
 * `loginWithRedirect` — see `ProtectedRoute`) instead of always the home page.
 * `useRefreshTokens: true` keeps sessions alive via silent refresh; it needs
 * Refresh Token Rotation + Allow Offline Access enabled on the Auth0 side.
 */
export function Auth0ProviderWithNavigate({ children }: Auth0ProviderWithNavigateProps) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo ?? '/', { replace: true })
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience }}
      useRefreshTokens
      cacheLocation="memory"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}
