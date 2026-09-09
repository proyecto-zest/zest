/**
 * Shared shell classes so `RecipeCard` and `RecipeCardSkeleton` render the
 * exact same box — the grid must not jump when a skeleton resolves into data.
 */
export const recipeCardShellClasses =
  'flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow'

export const recipeCardChipClasses = 'rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground'
