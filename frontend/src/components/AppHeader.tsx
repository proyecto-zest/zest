import { Link } from 'react-router-dom'
import { Logo } from './Logo'

/**
 * Sticky app header, matching the shell in the design reference.
 *
 * Navigation, search and the profile menu are intentionally left out: their
 * routes do not exist yet. They land with their own tickets.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 tablet:px-6">
        <Link to="/" aria-label="Zest home">
          <Logo />
        </Link>
      </div>
    </header>
  )
}
