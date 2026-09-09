import { NavLink } from 'react-router-dom'
import { Logo } from '../Logo'
import { NavAvatar } from './NavAvatar'
import { NavSearchBar } from './NavSearchBar'
import { NewRecipeButton } from './NewRecipeButton'
import { navLinks } from './navLinks'

/** Desktop nav: sticky top bar with tabs, matching top-nav.tsx in the design reference. */
export function TopNav() {
  return (
    <header className="sticky top-0 z-nav hidden h-nav-desktop border-b border-border bg-background/90 backdrop-blur tablet:block">
      <div className="flex h-full items-center gap-6 px-6">
        <NavLink to="/" aria-label="Zest home">
          <Logo />
        </NavLink>

        <nav aria-label="Main" className="flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <NavSearchBar />

        <div className="ml-auto flex items-center gap-3">
          <NewRecipeButton />
          <NavAvatar />
        </div>
      </div>
    </header>
  )
}
