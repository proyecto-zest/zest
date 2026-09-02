import { NumberField } from '../../../components/ui/NumberField'
import { SelectField } from '../../../components/ui/SelectField'
import { TextAreaField } from '../../../components/ui/TextAreaField'
import { TextField } from '../../../components/ui/TextField'
import { toOptions } from '../enumLabels'
import type { RecipeFormValues, RecipeMetadata } from '../types'
import { TimeAndDifficultyRow } from './TimeAndDifficultyRow'

type ScalarField = 'title' | 'description' | 'category' | 'time' | 'timeUnit' | 'difficulty' | 'servings'

interface RecipeDetailsSectionProps {
  values: RecipeFormValues
  metadata: RecipeMetadata
  setField: (field: ScalarField, value: string) => void
}

/** Title, description, category, time, difficulty and servings. */
export function RecipeDetailsSection({ values, metadata, setField }: RecipeDetailsSectionProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <TextField
        label="Recipe title"
        value={values.title}
        onChange={(v) => setField('title', v)}
        placeholder="e.g. Lemon Garlic Pasta"
      />
      <TextAreaField
        label="Description"
        value={values.description}
        onChange={(v) => setField('description', v)}
        placeholder="A short, mouth-watering summary…"
      />
      <SelectField
        label="Category"
        value={values.category}
        onChange={(v) => setField('category', v)}
        options={toOptions(metadata.categories)}
      />
      <TimeAndDifficultyRow values={values} metadata={metadata} setField={setField} />
      <NumberField
        label="Servings"
        value={values.servings}
        onChange={(v) => setField('servings', v)}
        placeholder="4"
      />
    </div>
  )
}
