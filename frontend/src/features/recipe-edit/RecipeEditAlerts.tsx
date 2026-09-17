import { Alert } from '../../components/alert'
import type { UpdateRecipeState } from './useUpdateRecipe'

interface RecipeEditAlertsProps {
  validationErrors: string[]
  onDismissValidation: () => void
  update: UpdateRecipeState
  onDismissUpdate: () => void
}

/**
 * Validation and server errors both render the same way — an inline `Alert`
 * above the form — so which one fired isn't a different visual experience.
 * The form's values are untouched either way, nothing is lost on failure.
 */
export function RecipeEditAlerts({ validationErrors, onDismissValidation, update, onDismissUpdate }: RecipeEditAlertsProps) {
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
      {update.status === 'error' && (
        <Alert variant="error" message={update.messages} onDismiss={onDismissUpdate} />
      )}
    </>
  )
}
