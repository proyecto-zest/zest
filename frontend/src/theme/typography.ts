/** Maps the typography tokens in `styles/tokens/typography.css` to Tailwind. */
const size = (name: string) => [`var(--text-${name})`, `var(--text-${name}-leading)`] as const

export const fontFamily = {
  heading: ['var(--font-heading)'],
  sans: ['var(--font-sans)'],
  mono: ['var(--font-mono)'],
}

export const fontSize = {
  '2xs': size('2xs'),
  xs: size('xs'),
  sm: size('sm'),
  base: size('base'),
  lg: size('lg'),
  xl: size('xl'),
  '2xl': size('2xl'),
  '3xl': size('3xl'),
  '4xl': size('4xl'),
  '5xl': size('5xl'),
}

export const fontWeight = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
}
