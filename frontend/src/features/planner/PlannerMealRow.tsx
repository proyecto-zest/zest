import { Link } from 'react-router-dom'
import { RecipeImage } from '../../components/RecipeImage'
import { formatRecipeTime } from '../../lib/formatRecipeTime'
import type { PlannerEntry } from '../../services/planner'
import { RemoveMealButton } from './RemoveMealButton'

interface PlannerMealRowProps {
  entry: PlannerEntry
  onRemove: () => void
}

export function PlannerMealRow({ entry, onRemove }: PlannerMealRowProps) {
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
          className="truncate text-sm font-semibold text-foreground hover:underline"
        >
          {entry.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {formatRecipeTime(entry.time, entry.timeUnit)}
        </span>
      </div>
      {/* Slot for the − / + quantity stepper (ZEST-125); shows the count until then. */}
      <span className="flex shrink-0 items-center text-xs font-bold text-muted-foreground">
        <span className="sr-only">Quantity </span>×{entry.quantity}
      </span>
      <RemoveMealButton title={entry.title} onClick={onRemove} />
    </div>
  )
}
