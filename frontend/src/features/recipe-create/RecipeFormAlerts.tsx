import { Alert } from '../../components/alert'
import { Modal } from '../../components/ui/Modal'
import type { CreateRecipeState } from './useCreateRecipe'

interface RecipeFormAlertsProps {
  validationErrors: string[]
  onDismissValidation: () => void
  creation: CreateRecipeState
  onDismissCreation: () => void
}

/**
 * Validation errors block publishing, so they show as a modal that demands
 * attention. Server errors stay inline — success is a toast (see RecipeCreateForm).
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
        <Modal onClose={onDismissValidation}>
          <Alert
            variant="error"
            title="Please fix the following"
            message={validationErrors}
            onDismiss={onDismissValidation}
          />
        </Modal>
      )}
      {creation.status === 'error' && (
        <Alert variant="error" message={creation.messages} onDismiss={onDismissCreation} />
      )}
    </>
  )
}
