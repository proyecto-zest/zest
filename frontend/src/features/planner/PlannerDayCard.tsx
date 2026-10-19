import type { PlannerEntry } from '../../services/planner'
import { formatPlannerDate } from './formatPlannerDate'
import { PlannerMealRow } from './PlannerMealRow'

interface PlannerDayCardProps {
  label: string
  /** `YYYY-MM-DD` */
  date: string
  isToday: boolean
  entries: PlannerEntry[]
  onAddMeal: () => void
}

export function PlannerDayCard({ label, date, isToday, entries, onAddMeal }: PlannerDayCardProps) {
  return (
    <section
      aria-label={formatPlannerDate(date)}
      aria-current={isToday ? 'date' : undefined}
      className="flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div
        className={`flex items-center justify-between border-b border-border px-4 py-3.5 ${isToday ? 'bg-accent/20' : 'bg-background'}`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
        >
          {Number(date.slice(8))}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {entries.map((entry) => (
          <PlannerMealRow key={entry.id} entry={entry} />
        ))}
        <button
          type="button"
          onClick={onAddMeal}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background p-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
        >
          + Add meal
        </button>
      </div>
    </section>
  )
}
