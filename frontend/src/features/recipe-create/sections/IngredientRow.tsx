import { NumberField } from '../../../components/ui/NumberField'
import { SelectField } from '../../../components/ui/SelectField'
import { RemoveRowButton } from '../../../components/ui/RemoveRowButton'
import { toOptions } from '../../../lib/enumLabels'
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
    <div className="flex flex-col gap-2 tablet:flex-row tablet:items-stretch tablet:gap-2.5">
      <div className="min-w-0 w-full tablet:flex-[2_1_0%]">
        <SelectField
          value={row.ingredientId}
          onChange={(v) => onChange({ ingredientId: v })}
          options={catalogOptions}
          placeholder="Ingredient"
          aria-label="Ingredient"
        />
      </div>
      {/* `contents` on tablet+ dissolves this wrapper so amount/unit/remove rejoin the row above as siblings. */}
      <div className="flex gap-2 tablet:contents">
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
        {canRemove && <RemoveRowButton onClick={onRemove} />}
      </div>
    </div>
  )
}
