export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'rounded-full bg-primary font-semibold text-primary-foreground',
  secondary: 'rounded-full border border-border bg-card font-semibold text-foreground',
  ghost: 'rounded-lg bg-background font-semibold text-primary',
  icon: 'rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
}

interface ButtonClassesOptions {
  variant: ButtonVariant
  /** Icon buttons size themselves via `className` (they aren't text, so padding doesn't apply). */
  size?: ButtonSize
  className?: string
}

/** Shared class builder so `<Button>` and link-styled buttons (e.g. `NewRecipeButton`) stay in sync. */
export function buttonClasses({ variant, size, className = '' }: ButtonClassesOptions): string {
  return [base, variantClasses[variant], size ? sizeClasses[size] : '', className].filter(Boolean).join(' ')
}
