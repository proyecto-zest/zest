import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekSelectorProps {
  label: string
  onPrevious: () => void
  onNext: () => void
  /** The label itself jumps back to the current week. */
  onCurrent: () => void
}

const arrowClasses =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70'

export function WeekSelector({ label, onPrevious, onNext, onCurrent }: WeekSelectorProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2.5 rounded-full border border-border bg-card p-1.5 tablet:w-auto">
      <button
        type="button"
        aria-label="Previous week"
        onClick={onPrevious}
        className={arrowClasses}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCurrent}
        aria-label={`${label}, go to this week`}
        className="flex-1 whitespace-nowrap px-1.5 text-center text-sm font-semibold text-foreground"
      >
        {label}
      </button>
      <button type="button" aria-label="Next week" onClick={onNext} className={arrowClasses}>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
