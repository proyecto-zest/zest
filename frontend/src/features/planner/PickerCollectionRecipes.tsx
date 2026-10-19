import { ArrowLeft } from 'lucide-react'
import { useCollectionDetail } from '../collections/useCollectionDetail'
import { PickerEmptyText } from './PickerEmptyText'
import { PickerListStatus } from './PickerListStatus'
import { PickerRecipeRow } from './PickerRecipeRow'
import type { PickedRecipe } from './types'

interface PickerCollectionRecipesProps {
  id: string
  onBack: () => void
  onSelect: (recipe: PickedRecipe) => void
}

export function PickerCollectionRecipes({ id, onBack, onSelect }: PickerCollectionRecipesProps) {
  const { state, retry } = useCollectionDetail(id)

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start pb-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Collections
      </button>
      {state.status === 'loading' && <PickerListStatus status="loading" label="recipes" />}
      {state.status === 'notFound' && (
        <PickerListStatus
          status="error"
          label="recipes"
          message="This collection no longer exists."
        />
      )}
      {state.status === 'error' && (
        <PickerListStatus
          status="error"
          label="recipes"
          message={state.message}
          onRetry={state.retryable ? retry : undefined}
        />
      )}
      {state.status === 'ok' && state.collection.recipes.length === 0 && (
        <PickerEmptyText>This collection is empty.</PickerEmptyText>
      )}
      {state.status === 'ok' &&
        state.collection.recipes.map((recipe) => (
          <PickerRecipeRow key={recipe.id} recipe={recipe} onSelect={onSelect} />
        ))}
    </>
  )
}
