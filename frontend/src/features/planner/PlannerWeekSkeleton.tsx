import { DAY_LABELS } from './weekDates'
import { PlannerWeekGrid } from './PlannerWeekGrid'

export function PlannerWeekSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading your week…</span>
      <PlannerWeekGrid>
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            aria-hidden="true"
            className="min-h-[20rem] animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </PlannerWeekGrid>
    </div>
  )
}
