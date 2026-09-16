import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/toast'
import { uploadRecipeImage } from '../../services/recipeImages'
import { buildCreateRecipePayload } from '../recipe-create/buildCreateRecipePayload'
import { CoverImageDropzone } from '../recipe-create/sections/CoverImageDropzone'
import { IngredientsSection } from '../recipe-create/sections/IngredientsSection'
import { RecipeDetailsSection } from '../recipe-create/sections/RecipeDetailsSection'
import { StepsSection } from '../recipe-create/sections/StepsSection'
import type { Ingredient, RecipeFormValues, RecipeMetadata } from '../recipe-create/types'
import { useCoverImage } from '../recipe-create/useCoverImage'
import { useRecipeForm } from '../recipe-create/useRecipeForm'
import { validateRecipeForm } from '../recipe-create/validateRecipeForm'
import { RecipeEditAlerts } from './RecipeEditAlerts'
import { RecipeEditConfirmModal } from './RecipeEditConfirmModal'
import { RecipeEditFormActions } from './RecipeEditFormActions'
import { useUpdateRecipe } from './useUpdateRecipe'

interface RecipeEditFormProps {
  recipeId: string
  initialValues: RecipeFormValues
  /** The recipe's current cover image, if it has one — shown until the user picks a different one. */
  initialImageUrl?: string
  catalog: Ingredient[]
  metadata: RecipeMetadata
}

/**
 * Fields, validation and the PUT /recipes/:id submit — same sections as
 * `RecipeCreateForm`, prefilled from the recipe being edited. A confirm
 * dialog sits between a valid submit and the actual request, per the ticket's
 * AC; on success the recipe's detail page shows the confirmation toast.
 */
export function RecipeEditForm({ recipeId, initialValues, initialImageUrl, catalog, metadata }: RecipeEditFormProps) {
  const form = useRecipeForm(initialValues)
  const update = useUpdateRecipe(recipeId)
  const cover = useCoverImage(initialImageUrl)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [uploading, setUploading] = useState(false)
  const errors = validateRecipeForm(form.values)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setValidationErrors(errors)
    if (errors.length > 0) return
    setConfirming(true)
  }

  const confirmSave = async () => {
    // Three cases: a new file picked (upload it, send its key), the existing
    // image removed and nothing picked to replace it (send an empty array so
    // the backend actually drops it), or neither touched (omit `imageKeys`
    // entirely so the backend leaves the recipe's current image as it is).
    let imageKeys: string[] | undefined
    if (cover.file) {
      setUploading(true)
      try {
        imageKeys = [await uploadRecipeImage(cover.file)]
      } catch (error) {
        cover.setError(error instanceof Error ? error.message : "Couldn't upload the image. Please try again.")
        setConfirming(false)
        return
      } finally {
        setUploading(false)
      }
    } else if (initialImageUrl && !cover.preview) {
      imageKeys = []
    }

    const payload = { ...buildCreateRecipePayload(form.values), imageKeys }
    const saved = await update.submit(payload)
    if (saved) {
      setConfirming(false)
      showToast(`"${payload.title}" was updated.`)
      // `replace`: swaps the `/edit` history entry instead of stacking on it,
      // so Back from the detail page goes to where the user was before
      // editing (the feed), not back into the edit form.
      navigate(`/recipes/${recipeId}`, { replace: true })
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

      <CoverImageDropzone
        preview={cover.preview}
        error={cover.error}
        uploading={uploading}
        onSelect={cover.select}
        onClear={cover.clear}
      />
      <RecipeDetailsSection values={form.values} metadata={metadata} setField={form.setField} />
      <IngredientsSection form={form} catalog={catalog} units={metadata.units} />
      <StepsSection form={form} />

      <RecipeEditFormActions
        recipeId={recipeId}
        submitting={uploading || update.state.status === 'loading'}
        disabled={errors.length > 0}
        uploading={uploading}
      />

      {confirming && (
        <RecipeEditConfirmModal
          pending={uploading || update.state.status === 'loading'}
          onConfirm={confirmSave}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  )
}
