import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeError } from '../src/errors.ts';

test('includes the code and message of a normal error', () => {
  const error = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });

  assert.equal(describeError(error), '(ECONNRESET): read ECONNRESET');
});

test('falls back to the class name for an error without message', () => {
  assert.equal(describeError(new Error('')), 'Error');
});

test('lists the inner errors of an AggregateError with an empty message', () => {
  const error = new AggregateError([new Error('connect ECONNREFUSED 127.0.0.1:5432')], '');

  assert.match(describeError(error), /AggregateError.*ECONNREFUSED 127\.0\.0\.1:5432/);
});

test('never returns an empty string', () => {
  assert.notEqual(describeError(''), '');
  assert.notEqual(describeError(undefined), '');
  assert.notEqual(describeError(null), '');
});
