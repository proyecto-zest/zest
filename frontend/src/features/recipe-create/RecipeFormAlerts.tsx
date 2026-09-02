import { Alert } from '../../components/alert'
import type { CreateRecipeState } from './useCreateRecipe'

interface RecipeFormAlertsProps {
  validationErrors: string[]
  onDismissValidation: () => void
  creation: CreateRecipeState
  onDismissCreation: () => void
}

/** The three feedback states a submit attempt can produce. */
export function RecipeFormAlerts({
  validationErrors,
  onDismissValidation,
  creation,
  onDismissCreation,
}: RecipeFormAlertsProps) {
  return (
    <>
      {validationErrors.length > 0 && (
        <Alert
          variant="error"
          title="Please fix the following"
          message={validationErrors}
          onDismiss={onDismissValidation}
        />
      )}
      {creation.status === 'error' && (
        <Alert variant="error" message={creation.messages} onDismiss={onDismissCreation} />
      )}
      {creation.status === 'success' && (
        <Alert
          variant="success"
          message={`"${creation.title}" was created.`}
          onDismiss={onDismissCreation}
        />
      )}
    </>
  )
}
