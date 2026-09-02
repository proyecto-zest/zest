import { TextAreaField } from '../../../components/ui/TextAreaField'
import { RemoveRowButton } from '../../../components/ui/RemoveRowButton'

interface StepRowProps {
  stepNumber: number
  text: string
  onChange: (text: string) => void
  onRemove: () => void
}

export function StepRow({ stepNumber, text, onChange, onRemove }: StepRowProps) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-base font-bold text-accent-foreground">
        {stepNumber}
      </span>
      <TextAreaField value={text} onChange={onChange} placeholder="Describe this step…" rows={2} />
      <RemoveRowButton onClick={onRemove} />
    </div>
  )
}
