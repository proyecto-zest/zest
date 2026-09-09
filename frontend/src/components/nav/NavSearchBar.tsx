import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fieldInputClasses } from '../ui/fieldInputClasses'

const DEBOUNCE_MS = 300

/**
 * Free-text recipe search, always visible in the nav — not just on the feed.
 * Typing here writes the `name` query param straight onto `/` (navigating
 * there first if you're elsewhere, e.g. a recipe's detail page), which is
 * exactly the param `useRecipeSearchFiltersInUrl` reads, so no separate
 * plumbing is needed between the nav and the feed.
 */
export function NavSearchBar() {
  const { pathname, search } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const onFeed = pathname === '/'
  const [draft, setDraft] = useState(() => (onFeed ? (searchParams.get('name') ?? '') : ''))

  useEffect(() => {
    if (onFeed) setDraft(searchParams.get('name') ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFeed, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = onFeed ? (searchParams.get('name') ?? '') : ''
      if (draft === current) return

      const params = onFeed ? new URLSearchParams(searchParams) : new URLSearchParams()
      if (draft) params.set('name', draft)
      else params.delete('name')
      navigate({ pathname: '/', search: params.toString() })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div className="relative w-full max-w-sm">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search recipes, ingredients…"
        aria-label="Search recipes by name"
        className={fieldInputClasses(undefined, 'w-full pl-10')}
      />
    </div>
  )
}
