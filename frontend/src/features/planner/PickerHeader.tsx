import { X } from 'lucide-react'
import { formatPlannerDate } from './formatPlannerDate'

interface PickerHeaderProps {
  titleId: string
  date: string
  onClose: () => void
}

export function PickerHeader({ titleId, date, onClose }: PickerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
      <div id={titleId} className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Add a meal
        </p>
        <h2 className="mt-0.5 font-serif text-2xl font-bold text-foreground">
          {formatPlannerDate(date)}
        </h2>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
