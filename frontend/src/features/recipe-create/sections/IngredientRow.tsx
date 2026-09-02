import { NumberField } from '../../../components/ui/NumberField'
import { SelectField } from '../../../components/ui/SelectField'
import { RemoveRowButton } from '../../../components/ui/RemoveRowButton'
import { toOptions } from '../enumLabels'
import type { Ingredient, IngredientRowValue } from '../types'

interface IngredientRowProps {
  row: IngredientRowValue
  catalog: Ingredient[]
  units: string[]
  canRemove: boolean
  onChange: (patch: Partial<IngredientRowValue>) => void
  onRemove: () => void
}

export function IngredientRow({ row, catalog, units, canRemove, onChange, onRemove }: IngredientRowProps) {
  const catalogOptions = catalog.map((i) => ({ value: i.id, label: i.name }))

  return (
    <div className="flex items-stretch gap-2.5">
      <div className="min-w-0 flex-[2_1_0%]">
        <SelectField
          value={row.ingredientId}
          onChange={(v) => onChange({ ingredientId: v })}
          options={catalogOptions}
          placeholder="Ingredient"
          aria-label="Ingredient"
        />
      </div>
      <div className="min-w-0 flex-1">
        <NumberField
          value={row.amount}
          onChange={(v) => onChange({ amount: v })}
          placeholder="Amount"
          aria-label="Amount"
          allowDecimal
        />
      </div>
      <div className="min-w-0 flex-1">
        <SelectField
          value={row.unit}
          onChange={(v) => onChange({ unit: v })}
          options={toOptions(units)}
          placeholder="Unit"
          aria-label="Unit"
        />
      </div>
      <RemoveRowButton onClick={onRemove} visible={canRemove} />
    </div>
  )
}
