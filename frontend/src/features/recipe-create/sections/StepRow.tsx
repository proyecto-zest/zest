import { GripVertical } from 'lucide-react'
import type { DragEventHandler } from 'react'
import { TextAreaField } from '../../../components/ui/TextAreaField'
import { RemoveRowButton } from '../../../components/ui/RemoveRowButton'

interface StepRowProps {
  stepNumber: number
  text: string
  canRemove: boolean
  isDragging: boolean
  onChange: (text: string) => void
  onRemove: () => void
  onDragStart: DragEventHandler
  onDragOver: DragEventHandler
  onDrop: DragEventHandler
  onDragEnd: DragEventHandler
}

export function StepRow({
  stepNumber,
  text,
  canRemove,
  isDragging,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: StepRowProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-start gap-2 ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="flex h-[3.25rem] w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground">
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-base font-bold text-accent-foreground">
        {stepNumber}
      </span>
      <TextAreaField
        value={text}
        onChange={onChange}
        placeholder="Describe this step…"
        rows={2}
        aria-label={`Step ${stepNumber}`}
      />
      {canRemove && <RemoveRowButton onClick={onRemove} />}
    </div>
  )
}
