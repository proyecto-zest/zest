const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Monday of the week `offset` weeks away from the week containing `today`. */
export function weekStart(today: Date, offset: number): Date {
  const daysSinceMonday = (today.getDay() + 6) % 7
  return addDays(today, offset * 7 - daysSinceMonday)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Local calendar day as `YYYY-MM-DD`; `toISOString` would shift it to UTC. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "Oct 19 – 25, 2026", or "Sep 28 – Oct 4, 2026" when the week spans two months. */
export function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const start = `${MONTHS[monday.getMonth()]} ${monday.getDate()}`
  const end =
    monday.getMonth() === sunday.getMonth()
      ? `${sunday.getDate()}`
      : `${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`
  return `${start} – ${end}, ${sunday.getFullYear()}`
}
