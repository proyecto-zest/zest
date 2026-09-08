import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { Ingredient } from '../../features/recipe-create/types'

interface IngredientFilterFieldProps {
  ingredients: Ingredient[]
  value: string[]
  onChange: (ingredientIds: string[]) => void
}

/** Multi-select for the ingredient filter: a button opens a checkbox list, selections show as removable chips. */
export function IngredientFilterField({ ingredients, value, onChange }: IngredientFilterFieldProps) {
  const [open, setOpen] = useState(false)
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

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const selected = ingredients.filter((i) => value.includes(i.id))

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        Ingredients{selected.length > 0 ? ` (${selected.length})` : ''}
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 top-full z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          {ingredients.map((ingredient) => (
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
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => toggle(ingredient.id)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {ingredient.name}
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
