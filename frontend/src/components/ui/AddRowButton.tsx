import { Plus } from 'lucide-react'

interface AddRowButtonProps {
  label: string
  onClick: () => void
}

/** Dashed "add another row" button, used by both the ingredients and steps lists. */
export function AddRowButton({ label, onClick }: AddRowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-semibold text-primary"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  )
}
