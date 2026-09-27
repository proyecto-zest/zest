import { useAuth0 } from '@auth0/auth0-react'
import { LogOut, User } from 'lucide-react'

/** Logged-in state: a plain logout control. No profile menu/avatar image yet. */
export function NavAvatar() {
  const { isAuthenticated, logout } = useAuth0()

  if (!isAuthenticated) {
    return (
      <span
        role="img"
        aria-label="Not signed in"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent text-muted-foreground"
      >
        <User aria-hidden="true" className="h-4 w-4" />
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
