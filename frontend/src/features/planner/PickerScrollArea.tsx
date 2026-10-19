import type { ReactNode } from 'react'

/** The scrolling body of the picker; the header, tabs and search stay fixed above it. */
export function PickerScrollArea({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6 pt-4">
      {children}
    </div>
  )
}
