export type RecipeMetaBadgesSize = 'sm' | 'lg'

interface SizeClasses {
  chip: string
  icon: string
}

const base = 'inline-flex items-center gap-1 rounded-full bg-secondary font-medium text-secondary-foreground'

/** Two sizes: `sm` for `RecipeCard`, `lg` for the recipe detail header. */
export const recipeMetaBadgeClasses: Record<RecipeMetaBadgesSize, SizeClasses> = {
  sm: { chip: `${base} px-2.5 py-0.5 text-xs`, icon: 'h-3 w-3' },
  lg: { chip: `${base} px-3.5 py-1.5 text-sm`, icon: 'h-4 w-4' },
}
