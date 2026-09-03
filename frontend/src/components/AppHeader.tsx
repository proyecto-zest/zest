import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

/**
 * Sticky app header, matching the shell in the design reference.
 *
 * Search and the profile menu are intentionally left out: their routes don't
 * exist yet. "New recipe" is the one link that already has somewhere to go.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 tablet:px-6">
        <Link to="/" aria-label="Zest home">
          <Logo />
        </Link>
        <Link
          to="/recipes/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New recipe
        </Link>
      </div>
    </header>
  )
}
