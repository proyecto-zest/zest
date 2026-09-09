import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { Pagination } from './Pagination'
import { RecipeGrid, RecipeGridSkeleton } from './RecipeGrid'
import { useRecipeFeed } from './useRecipeFeed'

/** The `/` route: paginated grid of every recipe, via GET /recipes. Keeps `page` in the URL so deleting a recipe and navigating back lands on the same page instead of resetting to 1. */
export function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const { state, retry, removeRecipe } = useRecipeFeed(page)

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">Discover</h1>
        {state.status === 'ok' && (
          <span className="text-sm text-muted-foreground">{state.data.pagination.total} recipes</span>
        )}
      </div>

      {state.status === 'loading' && <RecipeGridSkeleton />}

      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error" title="Couldn't load recipes" message={state.message} />
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ok' && state.data.recipes.length === 0 && (
        <p className="my-8 text-center text-sm text-muted-foreground">No recipes yet.</p>
      )}

      {state.status === 'ok' && state.data.recipes.length > 0 && (
        <div className={`flex flex-col gap-6 transition-opacity ${state.stale ? 'opacity-60' : ''}`}>
          <RecipeGrid recipes={state.data.recipes} onDeleted={handleDeleted} />
          <Pagination page={page} totalPages={state.data.pagination.totalPages} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}
