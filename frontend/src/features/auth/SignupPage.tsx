import { Link } from 'react-router-dom'
import { AuthActionButton } from './AuthActionButton'
import { AuthError } from './AuthError'
import { AuthLayout } from './AuthLayout'

/** `/signup`: hands off to Auth0 Universal Login with `screen_hint: 'signup'`. */
export function SignupPage() {
  return (
    <AuthLayout title="Create your account">
      <AuthError />
      <AuthActionButton label="Sign up" screenHint="signup" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
