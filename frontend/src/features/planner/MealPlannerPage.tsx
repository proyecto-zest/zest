import { useState } from 'react'
import type { PlannerEntry } from '../../services/planner'
import { PickerListStatus } from './PickerListStatus'
import { PlannerHeader } from './PlannerHeader'
import { PlannerWeekDays } from './PlannerWeekDays'
import { PlannerWeekSkeleton } from './PlannerWeekSkeleton'
import { RemoveMealDialog } from './RemoveMealDialog'
import { PlannerPicker } from './PlannerPicker'
import { usePlannerWeek } from './usePlannerWeek'
import { addDays, DAY_LABELS, formatWeekLabel, toDateKey, weekStart } from './weekDates'

/** The week, Monday to Sunday, with each day's planned meals. */
export function MealPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [pickerDate, setPickerDate] = useState<string | null>(null)
  const [removing, setRemoving] = useState<PlannerEntry | null>(null)
  const today = new Date()
  const monday = weekStart(today, weekOffset)
  const days = DAY_LABELS.map((label, index) => ({
    label,
    date: toDateKey(addDays(monday, index)),
  }))
  const { state, retry, refetch } = usePlannerWeek(days[0].date, days[6].date)

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
        <PickerListStatus
          status="error"
          label="your planner"
          message={state.message}
          onRetry={state.retryable ? retry : undefined}
        />
      )}
      {state.status === 'ok' && (
        <PlannerWeekDays
          days={days}
          today={today}
          entries={state.entries}
          onAddMeal={setPickerDate}
          onRemoveMeal={setRemoving}
        />
      )}
      {pickerDate && (
        <PlannerPicker date={pickerDate} refetch={refetch} onClose={() => setPickerDate(null)} />
      )}
      {removing && (
        <RemoveMealDialog entry={removing} refetch={refetch} onClose={() => setRemoving(null)} />
      )}
    </div>
  )
}
