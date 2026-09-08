export type RecipeMetaBadgesSize = 'sm' | 'lg'

interface SizeClasses {
  categoryChip: string
  box: string
  value: string
  label: string
  icon: string
}

/** Two sizes: `sm` for `RecipeCard`, `lg` for the recipe detail header. */
export const recipeMetaBadgeClasses: Record<RecipeMetaBadgesSize, SizeClasses> = {
  sm: {
    categoryChip: 'self-start rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
    box: 'rounded-lg border border-border bg-card p-2 text-center',
    value: 'text-xs font-bold text-foreground',
    label: 'text-xs text-muted-foreground',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    categoryChip: 'self-start rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground',
    box: 'rounded-xl border border-border bg-card p-3 text-center',
    value: 'text-sm font-bold text-foreground',
    label: 'text-xs text-muted-foreground',
    icon: 'h-5 w-5',
  },
}
