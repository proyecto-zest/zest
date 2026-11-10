import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatWeekLabel,
  toDateKey,
  weekDays,
  weekStart,
} from '../src/features/planner/weekDates.ts'

// Months are 0-based in `new Date(year, month, day)`.
const day = (year: number, month: number, date: number) => new Date(year, month - 1, date)

test('a week starts on Monday, and Sunday belongs to the week before it', () => {
  assert.equal(toDateKey(weekStart(day(2026, 11, 11), 0)), '2026-11-09') // Wednesday
  assert.equal(toDateKey(weekStart(day(2026, 11, 9), 0)), '2026-11-09') // Monday
  assert.equal(toDateKey(weekStart(day(2026, 11, 15), 0)), '2026-11-09') // Sunday
})

test('the offset moves whole weeks', () => {
  assert.equal(toDateKey(weekStart(day(2026, 11, 11), 1)), '2026-11-16')
  assert.equal(toDateKey(weekStart(day(2026, 11, 11), -2)), '2026-10-26')
})

test('weekDays runs Mon to Sun across a month and a year boundary', () => {
  const days = weekDays(day(2026, 12, 28))
  assert.deepEqual(
    days.map(({ label, date }) => `${label} ${date}`),
    [
      'Mon 2026-12-28',
      'Tue 2026-12-29',
      'Wed 2026-12-30',
      'Thu 2026-12-31',
      'Fri 2027-01-01',
      'Sat 2027-01-02',
      'Sun 2027-01-03',
    ],
  )
})

test('toDateKey keeps the local calendar day', () => {
  assert.equal(toDateKey(new Date(2026, 0, 5, 23, 30)), '2026-01-05')
})

test('the week label names both months when the week spans two', () => {
  assert.equal(formatWeekLabel(day(2026, 11, 9)), 'Nov 9 – 15, 2026')
  assert.equal(formatWeekLabel(day(2026, 9, 28)), 'Sep 28 – Oct 4, 2026')
  assert.equal(formatWeekLabel(day(2026, 12, 28)), 'Dec 28 – Jan 3, 2027')
})
