import { User } from 'lucide-react'

/** Reserved space for the user's avatar. No auth/profile data yet — placeholder only. */
export function NavAvatar() {
  return (
    <span
      role="img"
      aria-label="Your profile"
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent text-muted-foreground"
    >
      <User aria-hidden="true" className="h-4 w-4" />
    </span>
  )
}
