import { useState } from 'react'
import { NumberField } from '../../../components/ui/NumberField'
import { SelectField } from '../../../components/ui/SelectField'
import { toOptions } from '../../../lib/enumLabels'
import { timeRangeError } from '../fieldLimits'
import type { RecipeFormValues, RecipeMetadata } from '../types'

interface TimeAndDifficultyRowProps {
  values: RecipeFormValues
  metadata: RecipeMetadata
  setField: (field: 'time' | 'timeUnit' | 'difficulty', value: string) => void
}

/**
 * Time, time unit and difficulty. `time`'s valid range depends on `timeUnit`
 * (0–59 for minutes, 0–23 for hours), so an out-of-range keystroke is rejected
 * outright instead of just flagged after the fact.
 */
export function TimeAndDifficultyRow({ values, metadata, setField }: TimeAndDifficultyRowProps) {
  const [timeError, setTimeError] = useState<string | undefined>(undefined)

  const handleTimeChange = (raw: string) => {
    const error = timeRangeError(raw, values.timeUnit)
    setTimeError(error)
    if (error) return
    setField('time', raw)
  }

  const handleUnitChange = (unit: string) => {
    setField('timeUnit', unit)
    setTimeError(timeRangeError(values.time, unit))
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 tablet:grid-cols-3">
      <NumberField
        label="Time"
        value={values.time}
        onChange={handleTimeChange}
        placeholder="25"
        error={timeError}
        required
      />
      <SelectField
        label="Time unit"
        value={values.timeUnit}
        onChange={handleUnitChange}
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
