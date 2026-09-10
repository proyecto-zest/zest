import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/toast'
import { buildCreateRecipePayload } from '../recipe-create/buildCreateRecipePayload'
import { IngredientsSection } from '../recipe-create/sections/IngredientsSection'
import { RecipeDetailsSection } from '../recipe-create/sections/RecipeDetailsSection'
import { StepsSection } from '../recipe-create/sections/StepsSection'
import type { Ingredient, RecipeFormValues, RecipeMetadata } from '../recipe-create/types'
import { useRecipeForm } from '../recipe-create/useRecipeForm'
import { validateRecipeForm } from '../recipe-create/validateRecipeForm'
import { RecipeEditAlerts } from './RecipeEditAlerts'
import { RecipeEditConfirmModal } from './RecipeEditConfirmModal'
import { RecipeEditFormActions } from './RecipeEditFormActions'
import { useUpdateRecipe } from './useUpdateRecipe'

interface RecipeEditFormProps {
  recipeId: string
  initialValues: RecipeFormValues
  catalog: Ingredient[]
  metadata: RecipeMetadata
}

/**
 * Fields, validation and the PUT /recipes/:id submit — same sections as
 * `RecipeCreateForm`, prefilled from the recipe being edited. A confirm
 * dialog sits between a valid submit and the actual request, per the ticket's
 * AC; on success the recipe's detail page shows the confirmation toast.
 */
export function RecipeEditForm({ recipeId, initialValues, catalog, metadata }: RecipeEditFormProps) {
  const form = useRecipeForm(initialValues)
  const update = useUpdateRecipe(recipeId)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const errors = validateRecipeForm(form.values)
    setValidationErrors(errors)
    if (errors.length > 0) return
    setConfirming(true)
  }

  const confirmSave = async () => {
    const payload = buildCreateRecipePayload(form.values)
    const saved = await update.submit(payload)
    if (saved) {
      setConfirming(false)
      showToast(`"${payload.title}" was updated.`)
      navigate(`/recipes/${recipeId}`)
    } else {
      // Failure stays on the form (nothing is lost) — close the confirm dialog
      // so the inline server error from `RecipeEditAlerts` is visible.
      setConfirming(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <RecipeEditAlerts
        validationErrors={validationErrors}
        onDismissValidation={() => setValidationErrors([])}
        update={update.state}
        onDismissUpdate={update.reset}
      />

      <RecipeDetailsSection values={form.values} metadata={metadata} setField={form.setField} />
      <IngredientsSection form={form} catalog={catalog} units={metadata.units} />
      <StepsSection form={form} />

      <RecipeEditFormActions recipeId={recipeId} submitting={update.state.status === 'loading'} />

      {confirming && (
        <RecipeEditConfirmModal
          pending={update.state.status === 'loading'}
          onConfirm={confirmSave}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  )
}
