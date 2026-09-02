import { AddRowButton } from '../../../components/ui/AddRowButton'
import type { useRecipeForm } from '../useRecipeForm'
import { StepRow } from './StepRow'

interface StepsSectionProps {
  form: ReturnType<typeof useRecipeForm>
}

/** The dynamic steps list: add and remove rows before submitting. */
export function StepsSection({ form }: StepsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 font-serif text-xl font-bold">Instructions</h2>
      <div className="flex flex-col gap-3">
        {form.steps.rows.map((row, index) => (
          <StepRow
            key={row.id}
            stepNumber={index + 1}
            text={row.text}
            onChange={(text) => form.steps.update(row.id, { text })}
            onRemove={() => form.steps.remove(row.id)}
          />
        ))}
      </div>
      <AddRowButton label="Add step" onClick={form.steps.add} />
    </div>
  )
}
