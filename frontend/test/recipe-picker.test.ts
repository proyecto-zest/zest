import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPlannerDate } from '../src/features/planner/formatPlannerDate.ts'
import { toPickedRecipe } from '../src/features/planner/types.ts'

test('toPickedRecipe hands onSelect only the five contract fields', () => {
  const row = {
    id: 'r1',
    title: 'Pasta',
    time: 20,
    timeUnit: 'MINUTOS',
    category: 'CENA',
    author: { id: 'u1', username: 'ana' },
  }
  assert.deepEqual(toPickedRecipe(row, 'https://img/1.jpg'), {
    id: 'r1',
    title: 'Pasta',
    time: 20,
    timeUnit: 'MINUTOS',
    imageUrl: 'https://img/1.jpg',
  })
  assert.equal(toPickedRecipe(row, null).imageUrl, null)
})

test('formatPlannerDate keeps the calendar day instead of shifting it to UTC', () => {
  assert.equal(formatPlannerDate('2026-10-20'), 'Tuesday, Oct 20')
  assert.equal(formatPlannerDate('2027-01-01'), 'Friday, Jan 1')
})
