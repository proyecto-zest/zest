import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonVariants'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant
  size?: ButtonSize
}

/**
 * The single `<button>` component for the app: primary/secondary/ghost/icon looks.
 * Icon buttons get no text padding — it would squash the icon inside their fixed box.
 */
export function Button({ variant, size, className = '', type = 'button', ...rest }: ButtonProps) {
  const resolvedSize = size ?? (variant === 'icon' ? undefined : 'md')
  return <button type={type} className={buttonClasses({ variant, size: resolvedSize, className })} {...rest} />
}
