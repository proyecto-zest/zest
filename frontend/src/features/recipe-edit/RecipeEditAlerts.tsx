import { Alert } from '../../components/alert'
import { Modal } from '../../components/ui/Modal'
import type { UpdateRecipeState } from './useUpdateRecipe'

interface RecipeEditAlertsProps {
  validationErrors: string[]
  onDismissValidation: () => void
  update: UpdateRecipeState
  onDismissUpdate: () => void
}

/**
 * Validation errors block saving, so they show as a modal that demands
 * attention. Server errors stay inline, next to the form that caused them —
 * the form's values are untouched either way, nothing is lost on failure.
 */
export function RecipeEditAlerts({ validationErrors, onDismissValidation, update, onDismissUpdate }: RecipeEditAlertsProps) {
  return (
    <>
      {validationErrors.length > 0 && (
        <Modal onClose={onDismissValidation}>
          <Alert
            variant="error"
            title="Please fix the following"
            message={validationErrors}
            onDismiss={onDismissValidation}
          />
        </Modal>
      )}
      {update.status === 'error' && (
        <Alert variant="error" message={update.messages} onDismiss={onDismissUpdate} />
      )}
    </>
  )
}
