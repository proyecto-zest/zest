import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface AuthActionButtonProps {
  label: string
  /** `{ screen_hint: 'signup' }` for the signup screen, omitted for login. */
  screenHint?: 'signup'
}

/**
 * Triggers Universal Login. Shows a loading label instead of the normal one
 * while the redirect is in flight — it's a full-page navigation, so this only
 * covers the brief gap before the browser actually leaves.
 *
 * `returnTo` comes from `location.state`, set by `ProtectedRoute` when it
 * bounced an unauthenticated visitor to `/login` — forwarding it as
 * `appState` is what lets `onRedirectCallback` send them back to the route
 * they actually wanted instead of always the home page.
 */
export function AuthActionButton({ label, screenHint }: AuthActionButtonProps) {
  const { loginWithRedirect } = useAuth0()
  const location = useLocation()
  const [redirecting, setRedirecting] = useState(false)

  const handleClick = () => {
    setRedirecting(true)
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo
    loginWithRedirect({
      ...(screenHint ? { authorizationParams: { screen_hint: screenHint } } : {}),
      ...(returnTo ? { appState: { returnTo } } : {}),
    })
  }

  return (
    <Button variant="primary" className="w-full" disabled={redirecting} onClick={handleClick}>
      {redirecting ? 'Redirecting…' : label}
    </Button>
  )
}
