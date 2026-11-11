import type { PlannerEntry } from '../../services/planner'
import type { QuantityActions } from './useMealQuantity'
import { formatPlannerDate } from './formatPlannerDate'
import { PlannerDayHeader } from './PlannerDayHeader'
import { PlannerMealRow } from './PlannerMealRow'

interface PlannerDayCardProps {
  label: string
  /** `YYYY-MM-DD` */
  date: string
  isToday: boolean
  entries: PlannerEntry[]
  onAddMeal: () => void
  onRemoveMeal: (entry: PlannerEntry) => void
  quantityActions: QuantityActions
}

export function PlannerDayCard({
  label,
  date,
  isToday,
  entries,
  onAddMeal,
  onRemoveMeal,
  quantityActions,
}: PlannerDayCardProps) {
  return (
    <section
      aria-label={formatPlannerDate(date)}
      aria-current={isToday ? 'date' : undefined}
      className="flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <PlannerDayHeader label={label} date={date} isToday={isToday} />
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {entries.map((entry) => (
          <PlannerMealRow
            key={entry.id}
            entry={entry}
            onRemove={() => onRemoveMeal(entry)}
            quantityActions={quantityActions}
          />
        ))}
        <button
          type="button"
          onClick={onAddMeal}
          aria-label={`Add meal on ${formatPlannerDate(date)}`}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background p-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
        >
          + Add meal
        </button>
      </div>
    </section>
  )
}
