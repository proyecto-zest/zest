import { RecipePicker } from './RecipePicker'
import { useAddMeal } from './useAddMeal'

interface PlannerPickerProps {
  date: string
  refetch: () => void
  onClose: () => void
}

/** The recipe picker wired to POST /planner for one day. */
export function PlannerPicker({ date, refetch, onClose }: PlannerPickerProps) {
  const addMeal = useAddMeal(date, refetch)
  return <RecipePicker date={date} onSelect={addMeal} onClose={onClose} />
}
