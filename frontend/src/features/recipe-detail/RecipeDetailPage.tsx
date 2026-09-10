import { useParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { BackButton } from './BackButton'
import { IngredientsList } from './IngredientsList'
import { RecipeDetailHeader } from './RecipeDetailHeader'
import { RecipeDetailSkeleton } from './RecipeDetailSkeleton'
import { RecipeNotFound } from './RecipeNotFound'
import { StepsList } from './StepsList'
import { useRecipeDetail } from './useRecipeDetail'

/** The `/recipes/:id` route: full recipe via GET /recipes/:id. */
export function RecipeDetailPage() {
  const { id } = useParams()
  if (!id) return null

  return <RecipeDetailContent id={id} />
}

function RecipeDetailContent({ id }: { id: string }) {
  const { state, retry } = useRecipeDetail(id)

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      {state.status === 'loading' && <RecipeDetailSkeleton />}
      {state.status === 'notFound' && <RecipeNotFound />}

      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error" title="Couldn't load this recipe" message={state.message} />
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ok' && (
        <article className="flex flex-col gap-8">
          <RecipeDetailHeader recipe={state.recipe} />
          <div className="grid gap-8 tablet:grid-cols-[minmax(0,340px)_1fr]">
            <IngredientsList ingredients={state.recipe.ingredients} />
            <StepsList steps={state.recipe.steps} />
          </div>
        </article>
      )}
    </div>
  )
}
