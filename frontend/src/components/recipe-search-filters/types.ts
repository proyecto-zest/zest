/** Sentinel for the category/difficulty `<select>`'s "no filter" option — never a real backend enum value. */
export const ANY_OPTION = '__any__'

/** The four filters `RecipeSearchFilters` controls — an empty/undefined field means "no filter". */
export interface RecipeSearchFiltersValue {
  name: string
  ingredientIds: string[]
  category: string
  difficulty: string
}

export const emptyRecipeSearchFilters: RecipeSearchFiltersValue = {
  name: '',
  ingredientIds: [],
  category: '',
  difficulty: '',
}

export function hasActiveFilters(value: RecipeSearchFiltersValue): boolean {
  return (
    value.name.trim() !== '' || value.ingredientIds.length > 0 || value.category !== '' || value.difficulty !== ''
  )
}
