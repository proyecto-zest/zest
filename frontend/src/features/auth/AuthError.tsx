import { useAuth0 } from '@auth0/auth0-react'
import { Alert } from '../../components/alert'

/**
 * Surfaces whatever Auth0 sends back after a failed login/signup attempt.
 * Reads `error` off `useAuth0()` — the SDK already parses the callback and
 * exposes the failure there, so this never touches `window.location`'s query
 * params itself.
 */
export function AuthError() {
  const { error } = useAuth0()
  if (!error) return null

  return <Alert variant="error" message={error.message} />
}
