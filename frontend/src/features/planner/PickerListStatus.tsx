import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'

interface PickerListStatusProps {
  status: 'loading' | 'error'
  label: string
  message?: string
  onRetry?: () => void
}

/** Loading rows or an error with retry, for every list inside the picker. */
export function PickerListStatus({ status, label, message, onRetry }: PickerListStatusProps) {
  if (status === 'loading') {
    return (
      <div role="status" className="flex flex-col gap-2.5">
        <span className="sr-only">Loading {label}…</span>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} aria-hidden="true" className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Alert variant="error" title={`Couldn't load ${label}`} message={message ?? ''} />
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
