import { AddRowButton } from '../../../components/ui/AddRowButton'
import type { useRecipeForm } from '../useRecipeForm'
import type { Ingredient } from '../types'
import { IngredientRow } from './IngredientRow'

interface IngredientsSectionProps {
  form: ReturnType<typeof useRecipeForm>
  catalog: Ingredient[]
  units: string[]
}

/** The dynamic ingredients list: add and remove rows before submitting. */
export function IngredientsSection({ form, catalog, units }: IngredientsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 font-serif text-xl font-bold">Ingredients</h2>
      <div className="flex flex-col gap-2.5">
        {form.ingredients.rows.map((row) => (
          <IngredientRow
            key={row.id}
            row={row}
            catalog={catalog}
            units={units}
            onChange={(patch) => form.ingredients.update(row.id, patch)}
            onRemove={() => form.ingredients.remove(row.id)}
          />
        ))}
      </div>
      <AddRowButton label="Add ingredient" onClick={form.ingredients.add} />
    </div>
  )
}
