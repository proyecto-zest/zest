import { AlertIcon } from './AlertIcon'
import { AlertMessage } from './AlertMessage'
import { DismissButton } from './DismissButton'
import { alertVariants, type AlertVariant } from './alertVariants'

interface AlertProps {
  variant: AlertVariant
  /** One message, or several — validation errors usually come as a list. */
  message: string | string[]
  title?: string
  /** Passing a handler is what makes the close button appear. */
  onDismiss?: () => void
}

/** The single component for every error and success message in the app. */
export function Alert({ variant, message, title, onDismiss }: AlertProps) {
  const { container, icon, role, ariaLive } = alertVariants[variant]

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm text-foreground ${container}`}
    >
      <AlertIcon variant={variant} className={icon} />

      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <AlertMessage message={message} />
      </div>

      {onDismiss && <DismissButton onDismiss={onDismiss} />}
    </div>
  )
}
