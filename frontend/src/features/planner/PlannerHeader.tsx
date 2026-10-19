import { WeekSelector } from './WeekSelector'

interface PlannerHeaderProps {
  weekLabel: string
  onPrevious: () => void
  onNext: () => void
  onCurrent: () => void
}

export function PlannerHeader({ weekLabel, onPrevious, onNext, onCurrent }: PlannerHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground tablet:text-4xl">
          Meal Planner
        </h1>
        <p className="mt-1 text-muted-foreground">Plan your week, one delicious day at a time.</p>
      </div>
      <WeekSelector
        label={weekLabel}
        onPrevious={onPrevious}
        onNext={onNext}
        onCurrent={onCurrent}
      />
    </div>
  )
}
