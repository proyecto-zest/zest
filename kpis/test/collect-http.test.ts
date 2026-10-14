import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectHttpKpis } from '../src/collect-http.ts';
import type { FetchFn } from '../src/collect-http.ts';

const reply =
  (status: number, body: unknown): FetchFn =>
  async () =>
    ({ status, text: async () => JSON.stringify(body) }) as unknown as Response;

const healthy = reply(200, { status: 'ok', db: 'connected' });
const timeoutError = () => Object.assign(new Error('timed out'), { name: 'TimeoutError' });

// Healthy except for the 1-based call numbers listed in `timeouts`.
function withTimeoutsAt(...timeouts: number[]): FetchFn {
  let calls = 0;
  return async (url, init) => {
    calls += 1;
    if (timeouts.includes(calls)) throw timeoutError();
    return healthy(url, init);
  };
}

test('a healthy backend reports up, connected, no errors', async () => {
  const kpis = await collectHttpKpis('https://api.test', { fetchImpl: healthy });

  assert.equal(kpis.health_up, 1);
  assert.equal(kpis.db_connected, 1);
  assert.equal(kpis.health_error_rate, 0);
  assert.ok(kpis.health_latency_p95 >= 0);
});

test('status ok with the database down: up is 1 and db_connected is 0', async () => {
  const kpis = await collectHttpKpis('https://api.test', {
    fetchImpl: reply(200, { status: 'ok', db: 'disconnected' }),
  });

  assert.equal(kpis.health_up, 1);
  assert.equal(kpis.db_connected, 0);
});

test('the warm-up is retried once and is not counted in the 20 calls', async () => {
  let calls = 0;
  const fetchImpl: FetchFn = async (url, init) => {
    calls += 1;
    if (calls === 1) throw new Error('connection reset');
    return healthy(url, init);
  };

  const kpis = await collectHttpKpis('https://api.test', { fetchImpl });

  assert.equal(calls, 1 + 1 + 20);
  assert.equal(kpis.health_up, 1);
});

test('one timeout out of 20 counts as an error but stays below the 19th rank', async () => {
  const kpis = await collectHttpKpis('https://api.test', { fetchImpl: withTimeoutsAt(2) });

  assert.equal(kpis.health_error_rate, 5);
  assert.ok(kpis.health_latency_p95 < 10_000);
});

test('two timeouts out of 20 put the p95 at 10000 ms', async () => {
  const kpis = await collectHttpKpis('https://api.test', { fetchImpl: withTimeoutsAt(2, 3) });

  assert.equal(kpis.health_error_rate, 10);
  assert.equal(kpis.health_latency_p95, 10_000);
});

test('a dead backend is data: up and connected are 0, the rest is reported', async () => {
  const fetchImpl: FetchFn = async () => {
    throw new Error('ECONNREFUSED');
  };

  const kpis = await collectHttpKpis('https://api.test', { fetchImpl });

  assert.equal(kpis.health_up, 0);
  assert.equal(kpis.db_connected, 0);
  assert.equal(kpis.health_error_rate, 100);
});

test('a non-200 answer is an error and means not up', async () => {
  const kpis = await collectHttpKpis('https://api.test', {
    fetchImpl: reply(503, { status: 'error' }),
  });

  assert.equal(kpis.health_up, 0);
  assert.equal(kpis.health_error_rate, 100);
});
