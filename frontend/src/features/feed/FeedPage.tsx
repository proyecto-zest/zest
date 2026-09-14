import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { RecipeSearchFilters, RecipeSearchFiltersSkeleton, hasActiveFilters } from '../../components/recipe-search-filters'
import { Button } from '../../components/ui/Button'
import { useRecipeFormOptions } from '../recipe-create/useRecipeFormOptions'
import { Pagination } from './Pagination'
import { RecipeGrid, RecipeGridSkeleton } from './RecipeGrid'
import { useRecipeFeed } from './useRecipeFeed'
import { useRecipeSearchFiltersInUrl } from './useRecipeSearchFiltersInUrl'

/**
 * The `/` route: paginated, filterable grid of every recipe, via GET /recipes.
 * Keeps `page` in the URL so deleting a recipe and navigating back lands on
 * the same page instead of resetting to 1.
 */
export function FeedPage() {
  const [filters, setFilters] = useRecipeSearchFiltersInUrl()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const { state, retry, removeRecipe } = useRecipeFeed(page, filters)
  const options = useRecipeFormOptions()

  // `setFilters` replaces the whole query string with just the filter params
  // (see useRecipeSearchFiltersInUrl), so any filter change drops `page` from
  // the URL along with it — landing back on page 1 for free, no matter which
  // control changed the filters.
  const filtered = hasActiveFilters(filters)

  /** Clicking a page number is usually done scrolled down by the pagination control — jump back to the top of the grid so the new page starts from its beginning, not wherever the old one ended. */
  const goToPage = (next: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 1) params.delete('page')
      else params.set('page', String(next))
      return params
    })
    window.scrollTo(0, 0)
  }

  /** Deleting the last recipe on a page beyond the first would leave an empty page staring back — step back one instead. */
  const handleDeleted = (id: string) => {
    removeRecipe(id)
    if (page > 1 && state.status === 'ok' && state.data.recipes.length === 1) {
      goToPage(page - 1)
    }
  }

  /** The total and the page controls stay on screen while a new page loads — only the cards below are swapped for skeletons. */
  const pagination = state.status === 'ok' || state.status === 'switchingPage' ? state.data.pagination : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">Discover</h1>
        {pagination && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {state.status === 'switchingPage' && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
            {pagination.total} recipes
          </span>
        )}
      </div>

      {options.status === 'loading' && <RecipeSearchFiltersSkeleton />}

      {options.status === 'error' && (
        <Alert variant="error" title="Couldn't load filters" message={options.message} />
      )}

      {options.status === 'ok' && (
        <RecipeSearchFilters
          value={filters}
          onChange={setFilters}
          categories={options.metadata.categories}
          difficulties={options.metadata.difficulties}
          ingredients={options.ingredients}
        />
      )}

      {state.status === 'loading' && <RecipeGridSkeleton count={state.skeletonCount} />}

      {state.status === 'error' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-3">
            <Alert variant="error" title="Couldn't load recipes" message={state.message} />
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
          {state.staleData && state.staleData.recipes.length > 0 && (
            <div className="opacity-60">
              <RecipeGrid recipes={state.staleData.recipes} />
            </div>
          )}
        </div>
      )}

      {state.status === 'switchingPage' && (
        <div className="flex flex-col gap-6">
          <RecipeGridSkeleton count={state.skeletonCount} />
          <Pagination page={page} totalPages={state.data.pagination.totalPages} onPageChange={goToPage} />
        </div>
      )}

      {state.status === 'ok' && state.data.recipes.length === 0 && filtered && (
        <p className="my-8 text-center text-sm text-muted-foreground">No recipes match these filters.</p>
      )}

      {state.status === 'ok' && state.data.recipes.length === 0 && !filtered && (
        <p className="my-8 text-center text-sm text-muted-foreground">No recipes yet.</p>
      )}

      {state.status === 'ok' && state.data.recipes.length > 0 && (
        <div className="flex flex-col gap-6">
          <RecipeGrid recipes={state.data.recipes} onDeleted={handleDeleted} />
          <Pagination page={page} totalPages={state.data.pagination.totalPages} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}
