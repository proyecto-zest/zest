import { Plus } from 'lucide-react'
import { Button } from './Button'

interface AddRowButtonProps {
  label: string
  onClick: () => void
}

/** Dashed "add another row" button, used by both the ingredients and steps lists. */
export function AddRowButton({ label, onClick }: AddRowButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="mt-3.5 border border-dashed border-border"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      {label}
    </Button>
  )
}
