import { X } from 'lucide-react'
import { Button } from './Button'

interface RemoveRowButtonProps {
  onClick: () => void
}

/** Icon-only "remove this row" button. Stretches to the row's height, matching its inputs. */
export function RemoveRowButton({ onClick }: RemoveRowButtonProps) {
  return (
    <Button variant="icon" onClick={onClick} aria-label="Remove" className="w-12 shrink-0 self-stretch">
      <X aria-hidden="true" className="h-4 w-4" />
    </Button>
  )
}
