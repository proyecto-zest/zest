import { useState } from 'react'
import { Card } from '../../../components/Card'
import { AddRowButton } from '../../../components/ui/AddRowButton'
import type { useRecipeForm } from '../useRecipeForm'
import { StepRow } from './StepRow'

interface StepsSectionProps {
  form: ReturnType<typeof useRecipeForm>
}

/** The dynamic steps list: add, remove and drag-reorder rows before submitting. */
export function StepsSection({ form }: StepsSectionProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const canRemove = form.steps.rows.length > 1

  return (
    <Card title="Instructions">
      <div className="flex flex-col gap-3">
        {form.steps.rows.map((row, index) => (
          <StepRow
            key={row.id}
            stepNumber={index + 1}
            text={row.text}
            canRemove={canRemove}
            onChange={(text) => form.steps.update(row.id, { text })}
            onRemove={() => form.steps.remove(row.id)}
            isDragging={draggedId === row.id}
            onDragStart={() => setDraggedId(row.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedId) form.steps.reorder(draggedId, row.id)
              setDraggedId(null)
            }}
            onDragEnd={() => setDraggedId(null)}
          />
        ))}
      </div>
      <AddRowButton label="Add step" onClick={form.steps.add} />
    </Card>
  )
}
