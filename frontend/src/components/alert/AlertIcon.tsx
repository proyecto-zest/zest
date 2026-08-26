import { CircleAlert, CircleCheck } from 'lucide-react'
import type { AlertVariant } from './alertVariants'

interface AlertIconProps {
  variant: AlertVariant
  className?: string
}

const icons = {
  error: CircleAlert,
  success: CircleCheck,
}

/** Decorative variant icon. Hidden from screen readers: the text carries the meaning. */
export function AlertIcon({ variant, className = '' }: AlertIconProps) {
  const Icon = icons[variant]

  return <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${className}`} />
}
