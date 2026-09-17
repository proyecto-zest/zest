/** Maps the semantic color tokens in `styles/tokens/colors.css` to Tailwind. */
const channel = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`

export const colors = {
  transparent: 'transparent',
  current: 'currentColor',

  background: channel('background'),
  foreground: channel('foreground'),
  card: { DEFAULT: channel('card'), foreground: channel('card-foreground') },
  muted: { DEFAULT: channel('muted'), foreground: channel('muted-foreground') },
  secondary: {
    DEFAULT: channel('secondary'),
    foreground: channel('secondary-foreground'),
  },

  primary: { DEFAULT: channel('primary'), foreground: channel('primary-foreground') },
  accent: { DEFAULT: channel('accent'), foreground: channel('accent-foreground') },

  border: channel('border'),
  input: channel('input'),
  ring: channel('ring'),

  error: {
    DEFAULT: channel('error'),
    foreground: channel('error-foreground'),
    surface: channel('error-surface'),
    border: channel('error-border'),
  },
  success: {
    DEFAULT: channel('success'),
    foreground: channel('success-foreground'),
    surface: channel('success-surface'),
    border: channel('success-border'),
  },
}
