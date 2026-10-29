import type { PlannerEntry } from '../../services/planner'
import { PlannerDayCard } from './PlannerDayCard'
import { PlannerWeekGrid } from './PlannerWeekGrid'
import { toDateKey } from './weekDates'

interface PlannerWeekDaysProps {
  days: { label: string; date: string }[]
  today: Date
  entries: PlannerEntry[]
  onAddMeal: (date: string) => void
  onRemoveMeal: (entry: PlannerEntry) => void
}

/** The seven day cards, each with the entries planned on it. */
export function PlannerWeekDays({
  days,
  today,
  entries,
  onAddMeal,
  onRemoveMeal,
}: PlannerWeekDaysProps) {
  return (
    <PlannerWeekGrid>
      {days.map(({ label, date }) => (
        <PlannerDayCard
          key={date}
          label={label}
          date={date}
          isToday={date === toDateKey(today)}
          entries={entries.filter((entry) => entry.date === date)}
          onAddMeal={() => onAddMeal(date)}
          onRemoveMeal={onRemoveMeal}
        />
      ))}
    </PlannerWeekGrid>
  )
}
