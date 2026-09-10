import { useParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { RecipeNotFound } from '../recipe-detail/RecipeNotFound'
import { useRecipeDetail } from '../recipe-detail/useRecipeDetail'
import { useRecipeFormOptions } from '../recipe-create/useRecipeFormOptions'
import { RecipeEditForm } from './RecipeEditForm'
import { toEditFormValues } from './toEditFormValues'

/** The `/recipes/:id/edit` route: loads the recipe and the form's options, then renders the edit form prefilled. */
export function RecipeEditPage() {
  const { id } = useParams()
  if (!id) return null

  return <RecipeEditContent id={id} />
}

function RecipeEditContent({ id }: { id: string }) {
  const { state: recipeState, retry } = useRecipeDetail(id)
  const options = useRecipeFormOptions()

  const loading = recipeState.status === 'loading' || options.status === 'loading'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {loading && <p className="text-sm text-muted-foreground">Loading form…</p>}
      {recipeState.status === 'notFound' && <RecipeNotFound />}

      {recipeState.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error" title="Couldn't load this recipe" message={recipeState.message} />
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {options.status === 'error' && <Alert variant="error" message={options.message} />}

      {recipeState.status === 'ok' && options.status === 'ok' && (
        <>
          <div>
            <h1 className="font-serif text-4xl font-bold">Edit recipe</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update "{recipeState.recipe.title}".</p>
          </div>
          <RecipeEditForm
            recipeId={id}
            initialValues={toEditFormValues(recipeState.recipe)}
            catalog={options.ingredients}
            metadata={options.metadata}
          />
        </>
      )}
    </div>
  )
}
