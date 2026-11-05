import type { ReactNode } from 'react'
import { ChevronRight, Plus } from 'lucide-react'

interface PickerRowProps {
  title: string
  subtitle: string
  /** 48px thumbnail: a recipe photo or a collection cover. */
  thumbnail: ReactNode
  /** `add` picks the recipe; `open` drills into a collection. */
  action: 'add' | 'open'
  'aria-label': string
  onClick: () => void
}

/** One tappable row of the recipe picker, shared by recipes and collections. */
export function PickerRow({
  title,
  subtitle,
  thumbnail,
  action,
  'aria-label': ariaLabel,
  onClick,
}: PickerRowProps) {
  const Icon = action === 'add' ? Plus : ChevronRight
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">{thumbnail}</span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <Icon
        aria-hidden="true"
        className={`h-5 w-5 shrink-0 ${action === 'add' ? 'text-primary' : 'text-muted-foreground'}`}
      />
    </button>
  )
}
