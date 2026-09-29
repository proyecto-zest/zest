import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useCurrentUser } from '../../auth/useCurrentUser'

interface NavAvatarProps {
  placement?: 'above' | 'below'
  onNavigate?: () => void
}

/** The same profile/logout menu is available in the desktop bar and mobile drawer. */
export function NavAvatar({ placement = 'below', onNavigate }: NavAvatarProps) {
  const { isAuthenticated, logout } = useAuth0()
  const { user } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const dismissOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', dismissOnOutsideClick)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsideClick)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

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

  const initials = user?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-secondary font-serif text-sm font-bold text-foreground"
      >
        {user?.avatarUrl && failedUrl !== user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            onError={() => setFailedUrl(user.avatarUrl)}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || <User aria-hidden="true" className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg ${
            placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <Link
            to="/profile?tab=settings"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
            className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Edit profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              logout({ logoutParams: { returnTo: window.location.origin } })
            }}
            className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
