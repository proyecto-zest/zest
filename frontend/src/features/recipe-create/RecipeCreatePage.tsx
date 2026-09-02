import { Link } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { RecipeCreateForm } from './RecipeCreateForm'
import { useRecipeFormOptions } from './useRecipeFormOptions'

/** Recipe creation page: loads the form's options, then renders the form. */
export function RecipeCreatePage() {
  const options = useRecipeFormOptions()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          ← Cancel
        </Link>
        <h1 className="mt-1.5 font-serif text-4xl font-bold">Create a recipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share your dish with the Zest community.</p>
      </div>

      {options.status === 'loading' && <p className="text-sm text-muted-foreground">Loading form…</p>}
      {options.status === 'error' && <Alert variant="error" message={options.message} />}
      {options.status === 'ok' && (
        <RecipeCreateForm catalog={options.ingredients} metadata={options.metadata} />
      )}
    </div>
  )
}
