import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { RecipeGrid, RecipeGridSkeleton } from '../feed/RecipeGrid'
import { Pagination } from '../feed/Pagination'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonVariants'
import { useUserRecipes } from './useUserRecipes'

interface ProfileRecipesProps {
  userId: string
}

/** The current user's paginated recipes, including an actionable empty state. */
export function ProfileRecipes({ userId }: ProfileRecipesProps) {
  const [page, setPage] = useState(1)
  const { state, retry, removeRecipe } = useUserRecipes(userId, page)

  if (state.status === 'loading') return <RecipeGridSkeleton />

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="error" title="Couldn't load your recipes" message={state.message} />
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  if (state.data.recipes.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="font-serif text-xl font-bold text-foreground">No recipes yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Create your first recipe and it will appear here.
        </p>
        <Link
          to="/recipes/new"
          className={buttonClasses({ variant: 'primary', size: 'md', className: 'mt-5' })}
        >
          Create a recipe
        </Link>
      </div>
    )
  }

  const handleDeleted = (id: string) => {
    removeRecipe(id)
    if (page > 1 && state.data.recipes.length === 1) setPage(page - 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <RecipeGrid recipes={state.data.recipes} onDeleted={handleDeleted} />
      <Pagination
        page={page}
        totalPages={state.data.pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
