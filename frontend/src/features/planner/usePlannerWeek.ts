import { useEffect, useState } from 'react'
import { HttpError } from '../../services/httpClient'
import { listPlannerEntries, type PlannerEntry } from '../../services/planner'

type PlannerWeekState =
  | { status: 'loading' }
  | { status: 'ok'; entries: PlannerEntry[] }
  | { status: 'error'; message: string; retryable: boolean }

type Result = { from: string; attempt: number } & Exclude<PlannerWeekState, { status: 'loading' }>

/** The API gives no meaningful order within a day, so keep it stable by title. */
const sortByTitle = (entries: PlannerEntry[]) =>
  [...entries].sort((a, b) => a.title.localeCompare(b.title))

/** Loads one week of planner entries; switching weeks cancels the previous request. */
export function usePlannerWeek(from: string, to: string) {
  const [result, setResult] = useState<Result | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listPlannerEntries(from, to, { signal: controller.signal })
      .then((entries) => {
        if (!controller.signal.aborted)
          setResult({ status: 'ok', from, attempt, entries: sortByTitle(entries) })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResult({
          status: 'error',
          from,
          attempt,
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
  // Unlike `retry`, keeps the current week on screen while the new data loads.
  const refetch = () => setAttempt((value) => value + 1)
  // A reload is in flight; an optimistic edit now would be overwritten by its response.
  const refreshing = result !== null && result.attempt !== attempt
  // Optimistic edit of one entry's portions; the caller puts the old value back on failure.
  const setQuantity = (id: string, quantity: number) =>
    setResult((current) => {
      if (current?.status !== 'ok') return current
      const entries = current.entries.map((e) => (e.id === id ? { ...e, quantity } : e))
      return { ...current, entries }
    })
  return { state, retry, refetch, setQuantity, refreshing }
}
