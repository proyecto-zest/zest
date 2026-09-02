import { X } from 'lucide-react'

interface RemoveRowButtonProps {
  onClick: () => void
}

/** Icon-only "remove this row" button, used by both ingredient and step rows. */
export function RemoveRowButton({ onClick }: RemoveRowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <X aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
