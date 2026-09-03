import { X } from 'lucide-react'
import { Button } from './Button'

interface RemoveRowButtonProps {
  onClick: () => void
}

/** Icon-only "remove this row" button. Height matches the ~48px text inputs it sits beside. */
export function RemoveRowButton({ onClick }: RemoveRowButtonProps) {
  return (
    <Button variant="icon" onClick={onClick} aria-label="Remove" className="h-[3.25rem] w-[3.25rem] shrink-0">
      <X aria-hidden="true" className="h-4 w-4" />
    </Button>
  )
}
