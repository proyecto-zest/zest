import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeSearchText } from '../src/lib/search/normalizeSearchText.ts'

test('folds case and accents in catalog searches without transliterating other characters', () => {
  for (const [input, expected] of [
    ['PIÑA', 'pina'],
    ['AJÍ'.normalize('NFD'), 'aji'],
    ['Straße Æ Ø Ł Œ', 'straße æ ø ł œ'],
    ['Sopa 1½ limón', 'sopa 1½ limon'],
    ['100%_\\!', '100%_\\!'],
    ['', ''],
  ]) {
    assert.equal(normalizeSearchText(input), expected)
  }
})
