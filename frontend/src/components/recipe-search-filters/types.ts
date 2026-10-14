/** The five filters `RecipeSearchFilters` controls — an empty field means "no filter". */
export interface RecipeSearchFiltersValue {
  name: string
  author: string
  ingredientIds: string[]
  category: string
  difficulty: string
}

export const emptyRecipeSearchFilters: RecipeSearchFiltersValue = {
  name: '',
  author: '',
  ingredientIds: [],
  category: '',
  difficulty: '',
}

export function hasActiveFilters(value: RecipeSearchFiltersValue): boolean {
  return (
    value.name.trim() !== '' ||
    value.author.trim() !== '' ||
    value.ingredientIds.length > 0 ||
    value.category !== '' ||
    value.difficulty !== ''
  )
}
