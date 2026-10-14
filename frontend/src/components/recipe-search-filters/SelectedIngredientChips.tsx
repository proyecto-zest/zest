import { X } from 'lucide-react'
import type { Ingredient } from '../../features/recipe-create/types'

interface SelectedIngredientChipsProps {
  ingredients: Ingredient[]
  value: string[]
  onChange: (ingredientIds: string[]) => void
}

/**
 * Removable ingredient chips; the parent controls their shared filter row.
 */
export function SelectedIngredientChips({
  ingredients,
  value,
  onChange,
}: SelectedIngredientChipsProps) {
  const selected = ingredients.filter((i) => value.includes(i.id))
  if (selected.length === 0) return null

  return (
    <>
      {selected.map((ingredient) => (
        <button
          key={ingredient.id}
          type="button"
          onClick={() => onChange(value.filter((id) => id !== ingredient.id))}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
        >
          {ingredient.name}
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      ))}
    </>
  )
}
