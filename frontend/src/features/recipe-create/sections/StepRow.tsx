import type { DragEventHandler } from 'react'
import { TextAreaField } from '../../../components/ui/TextAreaField'
import { RemoveRowButton } from '../../../components/ui/RemoveRowButton'

interface StepRowProps {
  stepNumber: number
  text: string
  isDragging: boolean
  canRemove: boolean
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
  isDragging,
  canRemove,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: StepRowProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-stretch gap-2 ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* The number badge doubles as the drag handle: a draggable row loses to the textarea's own text selection. */}
      <span
        draggable
        onDragStart={onDragStart}
        aria-label={`Reorder step ${stepNumber}`}
        className="flex h-9 w-9 shrink-0 cursor-grab select-none items-center justify-center self-start rounded-full bg-accent font-serif text-base font-bold text-accent-foreground transition-shadow hover:shadow-md active:cursor-grabbing"
      >
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
