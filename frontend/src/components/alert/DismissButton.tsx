import { X } from 'lucide-react'

interface DismissButtonProps {
  onDismiss: () => void
}

/**
 * Close control, only rendered when the caller passes an `onDismiss` handler.
 * Matches the icon-button treatment the design reference uses in the top nav.
 */
export function DismissButton({ onDismiss }: DismissButtonProps) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss message"
      className="-m-1 shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <X aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
