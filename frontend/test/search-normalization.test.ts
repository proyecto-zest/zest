import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeSearchText } from '../src/lib/search/normalizeSearchText.ts'

test('normalizes accents, combining marks, ligatures and case like unaccent', () => {
  for (const [input, expected] of [
    ['PIÑA', 'pina'],
    ['AJÍ'.normalize('NFD'), 'aji'],
    ['Straße Æ Ø Ł Œ', 'strasse ae o l oe'],
    ['100%_\\!', '100%_\\!'],
    ['', ''],
  ]) {
    assert.equal(normalizeSearchText(input), expected)
  }
})
