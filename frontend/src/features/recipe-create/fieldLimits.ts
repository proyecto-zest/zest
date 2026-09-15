/** Character and range limits for the recipe form. Not yet enforced by the backend DTO. */
export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 500
export const STEP_MAX_LENGTH = 500

/** `time`'s upper bound depends on the selected `timeUnit`. */
export const MINUTES_MAX = 59
export const HOURS_MAX = 23

/** Shared by the live input guard and submit-time validation, so the two can't drift apart. */
export function timeRangeError(time: string, timeUnit: string): string | undefined {
  const value = Number(time)
  if (timeUnit === 'MINUTOS' && value > MINUTES_MAX) {
    return `Minutes can't be ${MINUTES_MAX + 1} or more — switch the unit to Hours for longer times.`
  }
  if (timeUnit === 'HORAS' && value > HOURS_MAX) {
    return `Hours can't be more than ${HOURS_MAX}.`
  }
  return undefined
}
