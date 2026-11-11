import { Link } from 'react-router-dom'
import { RecipeImage } from '../../components/RecipeImage'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import type { PlannerEntry } from '../../services/planner'
import type { QuantityActions } from './useMealQuantity'
import { QuantityStepper } from './QuantityStepper'
import { RemoveMealButton } from './RemoveMealButton'

interface PlannerMealRowProps {
  entry: PlannerEntry
  onRemove: () => void
  quantityActions: QuantityActions
}

export function PlannerMealRow({ entry, onRemove, quantityActions }: PlannerMealRowProps) {
  const recipePath = `/recipes/${entry.recipeId}`
  return (
    <div className="flex gap-2.5 rounded-xl border border-border bg-background p-2">
      <Link
        to={recipePath}
        tabIndex={-1}
        aria-hidden="true"
        className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
      >
        <RecipeImage src={entry.imageUrl ?? undefined} alt="" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <Link
          to={recipePath}
          className="line-clamp-2 break-words text-sm font-semibold text-foreground hover:underline"
        >
          {entry.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {formatRecipeTime(entry.time, entry.timeUnit)}
        </span>
        <QuantityStepper entry={entry} quantityActions={quantityActions} onRemove={onRemove} />
      </div>
      <RemoveMealButton title={entry.title} onClick={onRemove} />
    </div>
  )
}
