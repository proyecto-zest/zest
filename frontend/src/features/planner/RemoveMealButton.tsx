import { Trash2 } from 'lucide-react'

interface RemoveMealButtonProps {
  title: string
  onClick: () => void
}

/** Icon button on a planned meal; the label names the meal for screen readers. */
export function RemoveMealButton({ title, onClick }: RemoveMealButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Remove ${title}`}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-muted-foreground transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  )
}
