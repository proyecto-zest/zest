import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buenosAiresDate, median, percentile, ratioPercent, round2, withRetries } from '../src/math.ts';

test('percentile uses the nearest rank: the 19th of 20 values for p95', () => {
  const values = Array.from({ length: 20 }, (_, index) => (index + 1) * 10);
  assert.equal(percentile(values, 0.95), 190);
});

test('percentile does not depend on the input order', () => {
  assert.equal(percentile([30, 10, 20], 0.95), 30);
});

test('median handles odd and even lists', () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('round2 keeps two decimals', () => {
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(12.3456), 12.35);
});

test('ratioPercent is 0 when the total is 0', () => {
  assert.equal(ratioPercent(3, 0), 0);
  assert.equal(ratioPercent(1, 3), 33.33);
});

test('buenosAiresDate uses the Argentine calendar day, not UTC', () => {
  assert.equal(buenosAiresDate(new Date('2026-10-14T01:30:00Z')), '2026-10-13');
  assert.equal(buenosAiresDate(new Date('2026-10-14T11:17:00Z')), '2026-10-14');
});

test('withRetries waits between attempts and stops on success', async () => {
  const waits: number[] = [];
  let calls = 0;

  const result = await withRetries(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error('boom');
      return 'ok';
    },
    { waits: [10, 30], sleepFn: async (ms) => void waits.push(ms) },
  );

  assert.equal(result, 'ok');
  assert.deepEqual(waits, [10, 30]);
});

test('withRetries rethrows after the last attempt', async () => {
  let calls = 0;

  await assert.rejects(
    withRetries(
      async () => {
        calls += 1;
        throw new Error('still failing');
      },
      { waits: [1, 1], sleepFn: async () => {} },
    ),
    /still failing/,
  );
  assert.equal(calls, 3);
});
