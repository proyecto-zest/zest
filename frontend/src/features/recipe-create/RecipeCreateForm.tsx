import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/toast'
import { uploadRecipeImage } from '../../services/recipeImages'
import { buildCreateRecipePayload } from './buildCreateRecipePayload'
import { RecipeFormActions } from './RecipeFormActions'
import { RecipeFormAlerts } from './RecipeFormAlerts'
import { CoverImageDropzone } from './sections/CoverImageDropzone'
import { IngredientsSection } from './sections/IngredientsSection'
import { RecipeDetailsSection } from './sections/RecipeDetailsSection'
import { StepsSection } from './sections/StepsSection'
import type { Ingredient, RecipeMetadata } from './types'
import { useCoverImage } from './useCoverImage'
import { useCreateRecipe } from './useCreateRecipe'
import { useRecipeForm } from './useRecipeForm'
import { validateRecipeForm } from './validateRecipeForm'

interface RecipeCreateFormProps {
  catalog: Ingredient[]
  metadata: RecipeMetadata
}

/** Fields, validation and the POST /recipes submit. `noValidate`: the browser's own tooltip would preempt our modal. */
export function RecipeCreateForm({ catalog, metadata }: RecipeCreateFormProps) {
  const form = useRecipeForm()
  const creation = useCreateRecipe()
  const cover = useCoverImage()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateRecipeForm(form.values)
    setValidationErrors(errors)
    if (errors.length > 0) return

    // The image goes to S3 first: if that fails there's no recipe to clean up,
    // and the form stays as it is with the file still selected.
    let imageKeys: string[] | undefined
    if (cover.file) {
      setUploading(true)
      try {
        imageKeys = [await uploadRecipeImage(cover.file)]
      } catch (error) {
        cover.setError(error instanceof Error ? error.message : "Couldn't upload the image. Please try again.")
        return
      } finally {
        setUploading(false)
      }
    }

    const payload = { ...buildCreateRecipePayload(form.values), imageKeys }
    const created = await creation.submit(payload)
    if (created) {
      showToast(`"${payload.title}" was published.`)
      navigate('/')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <RecipeFormAlerts
        validationErrors={validationErrors}
        onDismissValidation={() => setValidationErrors([])}
        creation={creation.state}
        onDismissCreation={creation.reset}
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

      <RecipeFormActions submitting={uploading || creation.state.status === 'loading'} uploading={uploading} />
    </form>
  )
}
