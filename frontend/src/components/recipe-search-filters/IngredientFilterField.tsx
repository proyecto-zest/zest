import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { Ingredient } from '../../features/recipe-create/types'
import { fieldInputClasses } from '../ui/fieldInputClasses'

interface IngredientFilterFieldProps {
  ingredients: Ingredient[]
  value: string[]
  onChange: (ingredientIds: string[]) => void
}

/**
 * Multi-select for the ingredient filter: a button opens a checkbox list with
 * its own search box (the catalog has 200+ ingredients — scrolling to find
 * one isn't realistic). Selected chips render separately, in
 * `RecipeSearchFilters`, so growing that list never reflows this button.
 */
export function IngredientFilterField({ ingredients, value, onChange }: IngredientFilterFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const filtered = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase())),
    [ingredients, query],
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        Ingredients{value.length > 0 ? ` (${value.length})` : ''}
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <div className="relative mb-1.5">
            <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ingredients…"
              aria-label="Search ingredients"
              autoFocus
              className={fieldInputClasses(undefined, 'w-full py-1.5 pl-8 text-sm')}
            />
          </div>

          <ul role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && <li className="px-2.5 py-1.5 text-sm text-muted-foreground">No ingredients match.</li>}
            {filtered.map((ingredient) => (
              <li key={ingredient.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-secondary">
                  <input
                    type="checkbox"
                    checked={value.includes(ingredient.id)}
                    onChange={() => toggle(ingredient.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {ingredient.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
