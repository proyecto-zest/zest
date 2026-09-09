import { useState } from 'react'
import { Alert } from '../../components/alert'
import {
  RecipeSearchFilters,
  RecipeSearchFiltersSkeleton,
  emptyRecipeSearchFilters,
  hasActiveFilters,
} from '../../components/recipe-search-filters'
import { Button } from '../../components/ui/Button'
import { useRecipeFormOptions } from '../recipe-create/useRecipeFormOptions'
import { Pagination } from './Pagination'
import { RecipeGrid, RecipeGridSkeleton } from './RecipeGrid'
import { useRecipeFeed } from './useRecipeFeed'
import { useRecipeSearchFiltersInUrl } from './useRecipeSearchFiltersInUrl'

/** The `/` route: paginated, filterable grid of every recipe, via GET /recipes. */
export function FeedPage() {
  const [filters, setFilters] = useRecipeSearchFiltersInUrl()
  const [page, setPage] = useState(1)
  const { state, retry } = useRecipeFeed(page, filters)
  const options = useRecipeFormOptions()

  /** Any filter change goes back to page 1 — a stale page number from the previous search would be confusing. */
  const applyFilters: typeof setFilters = (next) => {
    setPage(1)
    setFilters(next)
  }

  const filtered = hasActiveFilters(filters)

  /** Clicking a page number is usually done scrolled down by the pagination control — jump back to the top of the grid so the new page starts from its beginning, not wherever the old one ended. */
  const goToPage = (next: number) => {
    setPage(next)
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">Discover</h1>
        {state.status === 'ok' && (
          <span className="text-sm text-muted-foreground">{state.data.pagination.total} recipes</span>
        )}
      </div>

      {options.status === 'loading' && <RecipeSearchFiltersSkeleton />}

      {options.status === 'ok' && (
        <RecipeSearchFilters
          value={filters}
          onChange={applyFilters}
          categories={options.metadata.categories}
          difficulties={options.metadata.difficulties}
          ingredients={options.ingredients}
          visible={{ name: false }}
        />
      )}

      {state.status === 'loading' && <RecipeGridSkeleton />}

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

      {state.status === 'ok' && state.data.recipes.length === 0 && filtered && (
        <div className="my-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">No recipes match these filters.</p>
          <Button variant="secondary" onClick={() => applyFilters(emptyRecipeSearchFilters)}>
            Clear filters
          </Button>
        </div>
      )}

      {state.status === 'ok' && state.data.recipes.length === 0 && !filtered && (
        <p className="my-8 text-center text-sm text-muted-foreground">No recipes yet.</p>
      )}

      {state.status === 'ok' && state.data.recipes.length > 0 && (
        <div className={`flex flex-col gap-6 transition-opacity ${state.stale ? 'opacity-60' : ''}`}>
          <RecipeGrid recipes={state.data.recipes} />
          <Pagination page={page} totalPages={state.data.pagination.totalPages} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}
