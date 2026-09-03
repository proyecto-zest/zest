import { NavLink } from 'react-router-dom'
import { navLinks } from './navLinks'

/** Mobile tab bar, fixed to the bottom, matching bottom-nav.tsx in the design reference. */
export function BottomNav() {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-nav border-t border-border bg-background/90 backdrop-blur tablet:hidden"
    >
      <div className="mx-auto flex h-nav-mobile max-w-md items-center justify-around px-2 pb-safe-bottom">
        {navLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 text-xs font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {link.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
