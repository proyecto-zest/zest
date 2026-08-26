/**
 * Per-variant styling and announcement behaviour.
 *
 * `error` uses role="alert", which screen readers announce assertively — it
 * interrupts, because a failed action needs attention now. `success` uses
 * role="status", announced politely, so a confirmation does not cut off whatever
 * the user is already hearing.
 */
export type AlertVariant = 'error' | 'success'

interface VariantConfig {
  container: string
  icon: string
  role: 'alert' | 'status'
  ariaLive: 'assertive' | 'polite'
}

export const alertVariants: Record<AlertVariant, VariantConfig> = {
  error: {
    container: 'bg-error-surface border-error-border',
    icon: 'text-error',
    role: 'alert',
    ariaLive: 'assertive',
  },
  success: {
    container: 'bg-success-surface border-success-border',
    icon: 'text-success',
    role: 'status',
    ariaLive: 'polite',
  },
}
