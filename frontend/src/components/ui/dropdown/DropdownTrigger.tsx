import type { ComponentPropsWithoutRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownTriggerProps extends ComponentPropsWithoutRef<'button'> {
  text: string
  isPlaceholder: boolean
  flash: boolean
  onFlashEnd: () => void
}

const DEFAULT_CLASSES =
  'flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

/** The closed select: current value (or placeholder) and a chevron. */
export function DropdownTrigger({
  text,
  isPlaceholder,
  flash,
  onFlashEnd,
  className = DEFAULT_CLASSES,
  ...buttonProps
}: DropdownTriggerProps) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      onAnimationEnd={onFlashEnd}
      className={`${className} ${flash ? 'animate-select-flash' : ''}`}
      {...buttonProps}
    >
      <span className={`truncate ${isPlaceholder ? 'text-muted-foreground' : ''}`}>{text}</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
