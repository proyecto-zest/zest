import { Card } from '../../components/Card'
import { enumLabel } from '../../lib/enumLabels'
import type { RecipeIngredientData } from '../../types/recipe'

interface IngredientsListProps {
  ingredients: RecipeIngredientData[]
}

/** Ingredients with amount + unit, inside the shared `Card` shell. */
export function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <Card title="Ingredients">
      <ul className="flex flex-col">
        {ingredients.map((row) => (
          <li
            key={row.ingredientId}
            className="flex items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-0"
          >
            <span className="min-w-0 break-words text-foreground">{row.ingredient.name}</span>
            <span className="max-w-[45%] shrink-0 break-words text-right font-medium text-muted-foreground">
              {row.amount} {enumLabel(row.unit)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
