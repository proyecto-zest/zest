import assert from 'node:assert/strict'
import { test } from 'node:test'
import { typeaheadIndex } from '../src/components/ui/dropdown/useTypeahead.ts'

const labels = ['Apple', 'Avocado', 'Banana', 'Basil', 'Carrot']

test('a letter with nothing selected highlights the first match', () => {
  assert.equal(typeaheadIndex(labels, 'a', -1), 0)
})

test('the same letter again cycles to the next match and wraps', () => {
  assert.equal(typeaheadIndex(labels, 'a', 0), 1)
  assert.equal(typeaheadIndex(labels, 'aa', 1), 0)
  assert.equal(typeaheadIndex(labels, 'b', 3), 2)
})

test('a longer prefix matches from the current option, also with nothing selected', () => {
  assert.equal(typeaheadIndex(labels, 'bas', 2), 3)
  assert.equal(typeaheadIndex(labels, 'av', -1), 1)
})

test('no match returns -1', () => {
  assert.equal(typeaheadIndex(labels, 'z', -1), -1)
  assert.equal(typeaheadIndex([], 'a', -1), -1)
})
