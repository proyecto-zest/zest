import { useState } from 'react'
import { ListStatus } from '../../components/ListStatus'
import { useToast } from '../../components/ui/toast'
import { PlannerHeader } from './PlannerHeader'
import { PlannerWeekDays } from './PlannerWeekDays'
import { PlannerWeekSkeleton } from './PlannerWeekSkeleton'
import { RecipePicker } from './RecipePicker'
import { usePlannerWeek } from './usePlannerWeek'
import { formatWeekLabel, toDateKey, weekDays, weekStart } from './weekDates'

/** The week, Monday to Sunday, with each day's planned meals. */
export function MealPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [pickerDate, setPickerDate] = useState<string | null>(null)
  const today = new Date()
  const monday = weekStart(today, weekOffset)
  const days = weekDays(monday)
  const { state, retry } = usePlannerWeek(days[0].date, days[6].date)
  const { showToast } = useToast()

  return (
    <div className="flex flex-col gap-6">
      <PlannerHeader
        weekLabel={formatWeekLabel(monday)}
        onPrevious={() => setWeekOffset((offset) => offset - 1)}
        onNext={() => setWeekOffset((offset) => offset + 1)}
        onCurrent={() => setWeekOffset(0)}
      />
      {state.status === 'loading' && <PlannerWeekSkeleton />}
      {state.status === 'error' && (
        <ListStatus
          status="error"
          label="your planner"
          message={state.message}
          onRetry={state.retryable ? retry : undefined}
        />
      )}
      {state.status === 'ok' && (
        <PlannerWeekDays
          days={days}
          today={toDateKey(today)}
          entries={state.entries}
          onAddMeal={setPickerDate}
        />
      )}
      {pickerDate && (
        <RecipePicker
          date={pickerDate}
          // Saving with POST /planner is ZEST-117; say so instead of closing silently.
          onSelect={() => showToast('Saving meals to the planner is not available yet.', 'error')}
          onClose={() => setPickerDate(null)}
        />
      )}
    </div>
  )
}
