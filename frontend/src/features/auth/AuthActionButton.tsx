import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
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
 */
export function AuthActionButton({ label, screenHint }: AuthActionButtonProps) {
  const { loginWithRedirect } = useAuth0()
  const [redirecting, setRedirecting] = useState(false)

  const handleClick = () => {
    setRedirecting(true)
    loginWithRedirect(screenHint ? { authorizationParams: { screen_hint: screenHint } } : undefined)
  }

  return (
    <Button variant="primary" className="w-full" disabled={redirecting} onClick={handleClick}>
      {redirecting ? 'Redirecting…' : label}
    </Button>
  )
}
