import { useSearchParams } from 'react-router-dom'
import { emptyRecipeSearchFilters, type RecipeSearchFiltersValue } from '../../components/recipe-search-filters'

/**
 * Reads/writes `RecipeSearchFilters`' value from the URL's query string, so
 * reloading or sharing the link keeps the search. The feed owns this — the
 * filters component itself never touches the router (see its docstring).
 */
export function useRecipeSearchFiltersInUrl() {
  const [searchParams, setSearchParams] = useSearchParams()

  const value: RecipeSearchFiltersValue = {
    name: searchParams.get('name') ?? emptyRecipeSearchFilters.name,
    ingredientIds: searchParams.getAll('ingredient'),
    category: searchParams.get('category') ?? emptyRecipeSearchFilters.category,
    difficulty: searchParams.get('difficulty') ?? emptyRecipeSearchFilters.difficulty,
  }

  const setValue = (next: RecipeSearchFiltersValue) => {
    const params = new URLSearchParams()
    if (next.name) params.set('name', next.name)
    for (const id of next.ingredientIds) params.append('ingredient', id)
    if (next.category) params.set('category', next.category)
    if (next.difficulty) params.set('difficulty', next.difficulty)
    setSearchParams(params, { replace: true })
  }

  return [value, setValue] as const
}
