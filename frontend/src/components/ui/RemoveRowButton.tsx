import { X } from 'lucide-react'
import { Button } from './Button'

interface RemoveRowButtonProps {
  onClick: () => void
}

/** Fixed square control, aligned with the input rather than its counter or error text. */
export function RemoveRowButton({ onClick }: RemoveRowButtonProps) {
  return (
    <Button variant="icon" onClick={onClick} aria-label="Remove" className="h-12 w-12 shrink-0 self-start">
      <X aria-hidden="true" className="h-4 w-4" />
    </Button>
  )
}
