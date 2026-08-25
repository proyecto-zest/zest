/** Maps the spacing, radius and shadow tokens in `styles/tokens/layout.css`. */

/** Tailwind's default step set, rebuilt on top of the project's spacing unit. */
const steps = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56,
  64,
] as const

export const spacing = Object.fromEntries([
  ['px', '1px'],
  ...steps.map((step) => [String(step), `calc(var(--space-unit) * ${step})`]),
])

export const borderRadius = {
  none: '0px',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  '3xl': 'var(--radius-3xl)',
  '4xl': 'var(--radius-4xl)',
  full: 'var(--radius-full)',
}

export const boxShadow = {
  none: 'none',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
}
