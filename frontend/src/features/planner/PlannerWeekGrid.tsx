import type { ReactNode } from 'react'

/** Seven day columns side by side (scrolling sideways) on tablet+, stacked on mobile. */
export function PlannerWeekGrid({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 tablet:grid tablet:auto-cols-[minmax(13.75rem,1fr)] tablet:grid-flow-col tablet:overflow-x-auto tablet:pb-2">
      {children}
    </div>
  )
}
