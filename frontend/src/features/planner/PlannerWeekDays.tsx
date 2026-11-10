import type { PlannerEntry } from '../../services/planner'
import type { QuantityActions } from './useMealQuantity'
import { PlannerDayCard } from './PlannerDayCard'
import { PlannerWeekGrid } from './PlannerWeekGrid'

interface PlannerWeekDaysProps {
  days: { label: string; date: string }[]
  /** `YYYY-MM-DD` of the current day. */
  today: string
  entries: PlannerEntry[]
  onAddMeal: (date: string) => void
  onRemoveMeal: (entry: PlannerEntry) => void
  quantityActions: QuantityActions
}

/** One card per day of the week, each with its own planned meals. */
export function PlannerWeekDays({
  days,
  today,
  entries,
  onAddMeal,
  onRemoveMeal,
  quantityActions,
}: PlannerWeekDaysProps) {
  return (
    <PlannerWeekGrid>
      {days.map(({ label, date }) => (
        <PlannerDayCard
          key={date}
          label={label}
          date={date}
          isToday={date === today}
          entries={entries.filter((entry) => entry.date === date)}
          onAddMeal={() => onAddMeal(date)}
          onRemoveMeal={onRemoveMeal}
          quantityActions={quantityActions}
        />
      ))}
    </PlannerWeekGrid>
  )
}
