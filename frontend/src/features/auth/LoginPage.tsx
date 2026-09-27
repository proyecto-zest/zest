import { Link } from 'react-router-dom'
import { AuthActionButton } from './AuthActionButton'
import { AuthError } from './AuthError'
import { AuthLayout } from './AuthLayout'

/** `/login`: hands off to Auth0 Universal Login, no `screen_hint`. */
export function LoginPage() {
  return (
    <AuthLayout title="Log in">
      <AuthError />
      <AuthActionButton label="Log in" />
      <p className="text-center text-sm text-muted-foreground">
        New to Zest?{' '}
        <Link to="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
