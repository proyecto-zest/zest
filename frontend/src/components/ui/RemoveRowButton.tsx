import { X } from 'lucide-react'
import { Button } from './Button'

interface RemoveRowButtonProps {
  onClick: () => void
  /** False keeps the button's slot but hides it, so a one-row list can't be emptied. */
  visible: boolean
}

/**
 * Icon-only "remove this row" button. It stretches to the row's height instead of
 * hardcoding one, so it keeps matching the inputs beside it if their padding changes.
 * When hidden it stays in the layout: otherwise every column shifts as rows come and go.
 */
export function RemoveRowButton({ onClick, visible }: RemoveRowButtonProps) {
  return (
    <Button
      variant="icon"
      onClick={onClick}
      aria-label="Remove"
      disabled={!visible}
      tabIndex={visible ? undefined : -1}
      aria-hidden={visible ? undefined : true}
      className={`w-12 shrink-0 self-stretch ${visible ? '' : 'invisible'}`}
    >
      <X aria-hidden="true" className="h-4 w-4" />
    </Button>
  )
}
