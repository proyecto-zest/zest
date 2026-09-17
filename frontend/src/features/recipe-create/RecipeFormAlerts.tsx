import { Alert } from '../../components/alert'
import type { CreateRecipeState } from './useCreateRecipe'

interface RecipeFormAlertsProps {
  validationErrors: string[]
  onDismissValidation: () => void
  creation: CreateRecipeState
  onDismissCreation: () => void
}

/**
 * Validation and server errors both render the same way — an inline `Alert`
 * above the form — so which one fired isn't a different visual experience.
 */
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
    </>
  )
}
