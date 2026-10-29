/**
 * "Monday, Oct 20" for a `YYYY-MM-DD` calendar date. The date is built in
 * local time on purpose: `new Date('2026-10-20')` would be UTC midnight and
 * show the previous day west of Greenwich.
 */
export function formatPlannerDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
