import { NumberField } from '../../../components/ui/NumberField'
import { SelectField } from '../../../components/ui/SelectField'
import { toOptions } from '../enumLabels'
import type { RecipeFormValues, RecipeMetadata } from '../types'

interface TimeAndDifficultyRowProps {
  values: RecipeFormValues
  metadata: RecipeMetadata
  setField: (field: 'time' | 'timeUnit' | 'difficulty', value: string) => void
}

/** Time, time unit and difficulty, laid out as the three-column row from the design. */
export function TimeAndDifficultyRow({ values, metadata, setField }: TimeAndDifficultyRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 tablet:grid-cols-3">
      <NumberField
        label="Time"
        value={values.time}
        onChange={(v) => setField('time', v)}
        placeholder="25"
        required
      />
      <SelectField
        label="Time unit"
        value={values.timeUnit}
        onChange={(v) => setField('timeUnit', v)}
        options={toOptions(metadata.timeUnits)}
        required
      />
      <SelectField
        label="Difficulty"
        value={values.difficulty}
        onChange={(v) => setField('difficulty', v)}
        options={toOptions(metadata.difficulties)}
        required
      />
    </div>
  )
}
