import type { Config } from 'tailwindcss'

/**
 * Base config. The design system tokens (palette, typography, spacing,
 * radii, shadows and breakpoints) are defined in ZEST-20; until then
 * Tailwind's defaults apply.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
