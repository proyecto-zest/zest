import { useState, type FormEvent } from 'react'
import { buildCreateRecipePayload } from './buildCreateRecipePayload'
import { RecipeFormActions } from './RecipeFormActions'
import { RecipeFormAlerts } from './RecipeFormAlerts'
import { CoverImageDropzone } from './sections/CoverImageDropzone'
import { IngredientsSection } from './sections/IngredientsSection'
import { RecipeDetailsSection } from './sections/RecipeDetailsSection'
import { StepsSection } from './sections/StepsSection'
import type { Ingredient, RecipeMetadata } from './types'
import { useCreateRecipe } from './useCreateRecipe'
import { useRecipeForm } from './useRecipeForm'
import { validateRecipeForm } from './validateRecipeForm'

interface RecipeCreateFormProps {
  catalog: Ingredient[]
  metadata: RecipeMetadata
}

/** The recipe form itself: fields, validation, and the POST /recipes submit. */
export function RecipeCreateForm({ catalog, metadata }: RecipeCreateFormProps) {
  const form = useRecipeForm()
  const creation = useCreateRecipe()
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateRecipeForm(form.values)
    setValidationErrors(errors)
    if (errors.length > 0) return

    const created = await creation.submit(buildCreateRecipePayload(form.values))
    if (created) form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <RecipeFormAlerts
        validationErrors={validationErrors}
        onDismissValidation={() => setValidationErrors([])}
        creation={creation.state}
        onDismissCreation={creation.reset}
      />

      <CoverImageDropzone />
      <RecipeDetailsSection values={form.values} metadata={metadata} setField={form.setField} />
      <IngredientsSection form={form} catalog={catalog} units={metadata.units} />
      <StepsSection form={form} />

      <RecipeFormActions submitting={creation.state.status === 'loading'} />
    </form>
  )
}
