interface PlannerDayHeaderProps {
  label: string
  /** `YYYY-MM-DD` */
  date: string
  isToday: boolean
}

/** Weekday name and day number at the top of a day card; today is tinted. */
export function PlannerDayHeader({ label, date, isToday }: PlannerDayHeaderProps) {
  return (
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
  )
}
