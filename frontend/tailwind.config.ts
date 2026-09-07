import type { Config } from 'tailwindcss'
import { breakpoints } from './src/theme/breakpoints'
import { colors } from './src/theme/colors'
import { borderRadius, boxShadow, maxWidth, spacing, zIndex } from './src/theme/layout'
import { fontFamily, fontSize, fontWeight } from './src/theme/typography'

/**
 * Every scale below is replaced rather than extended, so the design system
 * tokens are the only values the utilities can resolve to. Reaching for a value
 * that has no token is then a build-visible mistake, not a silent one.
 *
 * The tokens themselves live in `src/styles/tokens/`; these modules only map
 * them onto Tailwind's theme keys.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: breakpoints,
    colors,
    spacing,
    borderRadius,
    boxShadow,
    fontFamily,
    fontSize,
    fontWeight,
    extend: {
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(0.5rem)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: { 'toast-in': 'toast-in 150ms ease-out' },
      maxWidth,
      zIndex,
    },
  },
  plugins: [],
} satisfies Config
