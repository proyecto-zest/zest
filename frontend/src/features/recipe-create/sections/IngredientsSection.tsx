import { Card } from '../../../components/Card'
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
    <Card title="Ingredients">
      <div className="flex flex-col gap-2.5">
        {form.ingredients.rows.map((row) => (
          <IngredientRow
            key={row.id}
            row={row}
            catalog={catalog}
            units={units}
            canRemove={form.ingredients.rows.length > 1}
            onChange={(patch) => form.ingredients.update(row.id, patch)}
            onRemove={() => form.ingredients.remove(row.id)}
          />
        ))}
      </div>
      <AddRowButton label="Add ingredient" onClick={form.ingredients.add} />
    </Card>
  )
}
