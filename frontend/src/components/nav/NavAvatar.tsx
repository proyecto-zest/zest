import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Profile entry point. ZEST-32 will replace the placeholder with the authenticated avatar. */
export function NavAvatar() {
  return (
    <Link
      to="/profile"
      aria-label="Your profile"
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent text-muted-foreground"
    >
      <User aria-hidden="true" className="h-4 w-4" />
    </Link>
  )
}
