import { ChevronDown } from 'lucide-react'

/** The custom dropdown arrow for `SelectField` — fixed position, not the browser's own. */
export function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    />
  )
}
