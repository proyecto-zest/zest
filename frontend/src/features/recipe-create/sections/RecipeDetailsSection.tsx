import { Card } from '../../../components/Card'
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
    <Card>
      <div className="flex flex-col gap-4">
        <TextField
          label="Recipe title"
          value={values.title}
          onChange={(v) => setField('title', v)}
          placeholder="e.g. Lemon Garlic Pasta"
          required
        />
        <TextAreaField
          label="Description"
          value={values.description}
          onChange={(v) => setField('description', v)}
          placeholder="A short, mouth-watering summary…"
          required
        />
        <SelectField
          label="Category"
          value={values.category}
          onChange={(v) => setField('category', v)}
          options={toOptions(metadata.categories)}
          required
        />
        <TimeAndDifficultyRow values={values} metadata={metadata} setField={setField} />
        <NumberField
          label="Servings"
          value={values.servings}
          onChange={(v) => setField('servings', v)}
          placeholder="4"
          required
        />
      </div>
    </Card>
  )
}
