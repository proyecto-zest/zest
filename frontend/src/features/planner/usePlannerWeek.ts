import { useEffect, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { listPlannerEntries, type PlannerEntry } from '../../services/planner'

type PlannerWeekState =
  | { status: 'loading' }
  | { status: 'ok'; entries: PlannerEntry[] }
  | { status: 'error'; message: string; retryable: boolean }

type Result = { from: string } & Exclude<PlannerWeekState, { status: 'loading' }>

/** Loads one week of planner entries; switching weeks cancels the previous request. */
export function usePlannerWeek(from: string, to: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listPlannerEntries(from, to, { signal: controller.signal })
      .then((entries) => {
        if (!controller.signal.aborted) setResult({ status: 'ok', from, entries })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResult({
          status: 'error',
          from,
          message: error instanceof Error ? error.message : 'Could not load your planner.',
          retryable: !(error instanceof HttpError) || error.status >= 500,
        })
      })
    return () => controller.abort()
  }, [from, to, attempt])

  const state: PlannerWeekState = result?.from === from ? result : { status: 'loading' }
  const retry = () => {
    setResult(null)
    setAttempt((value) => value + 1)
  }
  return { state, retry }
}
