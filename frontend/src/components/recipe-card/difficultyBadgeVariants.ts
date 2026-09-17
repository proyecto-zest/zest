/**
 * Difficulty → color scale, using the system's existing semantic tokens
 * (green/yellow/red already exist as success/accent/error) instead of
 * introducing new colors just for this.
 */
export const difficultyBadgeClasses: Record<string, string> = {
  FACIL: 'bg-success text-success-foreground',
  MEDIA: 'bg-accent text-accent-foreground',
  DIFICIL: 'bg-error text-error-foreground',
}

/** Any difficulty value the map above doesn't recognize falls back to this. */
export const difficultyBadgeFallback = 'bg-secondary text-secondary-foreground'
