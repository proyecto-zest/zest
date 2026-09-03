import { useState } from 'react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { Pagination } from './Pagination'
import { RecipeGrid, RecipeGridSkeleton } from './RecipeGrid'
import { useRecipeFeed } from './useRecipeFeed'

/** The `/` route: paginated grid of every recipe, via GET /recipes. */
export function FeedPage() {
  const [page, setPage] = useState(1)
  const { state, retry } = useRecipeFeed(page)

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
        <>
          <RecipeGrid recipes={state.data.recipes} />
          <Pagination page={page} totalPages={state.data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
