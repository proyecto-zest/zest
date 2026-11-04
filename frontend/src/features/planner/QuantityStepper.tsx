import type { PlannerEntry } from '../../services/planner'
import { useMealQuantity } from './useMealQuantity'

interface QuantityStepperProps {
  entry: PlannerEntry
  setQuantity: (id: string, quantity: number) => void
  onRemove: () => void
}

const buttonClasses =
  'flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'

/**
 * − / quantity / + on a planned meal, under its title: a day column is too narrow for it
 * beside the image and the remove button. − from 1 opens the remove dialog instead.
 */
export function QuantityStepper({ entry, setQuantity, onRemove }: QuantityStepperProps) {
  const { pending, decrease, increase, canIncrease } = useMealQuantity(entry, setQuantity, onRemove)

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Remove one"
        disabled={pending}
        onClick={decrease}
        className={`${buttonClasses} border border-border bg-card`}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-[14px] text-center text-xs font-bold">
        {entry.quantity}
      </span>
      <button
        type="button"
        aria-label="Add one"
        disabled={pending || !canIncrease}
        onClick={increase}
        className={`${buttonClasses} bg-primary text-primary-foreground`}
      >
        +
      </button>
    </div>
  )
}
