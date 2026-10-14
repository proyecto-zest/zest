import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KPI_IDS } from '../src/catalog.ts';
import { collectCiKpi } from '../src/collect-ci.ts';
import type { FetchFn } from '../src/collect-http.ts';
import { neonKpis } from '../src/collect-neon.ts';
import type { NeonSession } from '../src/collect-neon.ts';
import { collectAll } from '../src/collect.ts';
import type { Config } from '../src/config.ts';

const config: Config = {
  env: 'prod',
  dryRun: true,
  backendUrl: 'https://api.test',
  neonUrl: 'postgres://unused',
  githubToken: 'token',
  githubRepo: 'proyecto-zest/zest',
  storageLimitBytes: 1024 ** 3,
};

// Fake fetch: /health answers healthy, GitHub answers with `conclusion`.
function fakeFetch({
  conclusion = 'success',
  githubStatus = 200,
}: { conclusion?: string | null; githubStatus?: number } = {}): FetchFn {
  return async (url) => {
    if (String(url).includes('api.github.com')) {
      return {
        ok: githubStatus === 200,
        status: githubStatus,
        json: async () => ({ workflow_runs: conclusion ? [{ conclusion }] : [] }),
      } as unknown as Response;
    }
    return {
      status: 200,
      text: async () => JSON.stringify({ status: 'ok', db: 'connected' }),
    } as unknown as Response;
  };
}

interface SessionOptions {
  active?: number;
  managed?: number;
  bytes?: number;
  failUsers?: boolean;
}

// Fake Neon session answering by the shape of the SQL; records every call.
function fakeSession({ active = 10, managed = 4, bytes = 53_687_091, failUsers = false }: SessionOptions = {}) {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const session: NeonSession = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('pg_database_size')) return { rows: [{ value: bytes }] };
      if (sql.trim() === 'SELECT 1') return { rows: [{ '?column?': 1 }] };
      if (failUsers) {
        throw Object.assign(new Error('relation "users" does not exist'), { code: '42P01' });
      }
      if (sql.includes('EXISTS')) return { rows: [{ value: managed }] };
      return { rows: [{ value: active }] };
    },
    async close() {},
  };
  return { session, calls };
}

const noSleep = async () => {};

test('collects all 10 KPIs and derives the managed rate', async () => {
  const { session } = fakeSession({ active: 8, managed: 2 });

  const { values, failures } = await collectAll(config, {
    fetchImpl: fakeFetch(),
    session,
    sleepFn: noSleep,
  });

  assert.deepEqual(failures, []);
  assert.deepEqual(Object.keys(values), [...KPI_IDS]);
  assert.equal(values.active_users_30d, 8);
  assert.equal(values.platform_managed_users, 2);
  assert.equal(values.platform_managed_rate, 25);
  assert.equal(values.db_storage_used, 5);
  assert.equal(values.ci_last_run_ok, 1);
});

test('zero active users gives a managed rate of 0, which is real data', async () => {
  const { session } = fakeSession({ active: 0, managed: 0 });

  const { values, failures } = await collectAll(config, {
    fetchImpl: fakeFetch(),
    session,
    sleepFn: noSleep,
  });

  assert.deepEqual(failures, []);
  assert.equal(values.active_users_30d, 0);
  assert.equal(values.platform_managed_rate, 0);
});

test('a KPI that cannot be measured is a failure, never a filler 0', async () => {
  const { session } = fakeSession({ failUsers: true });

  const { values, failures } = await collectAll(config, {
    fetchImpl: fakeFetch(),
    session,
    sleepFn: noSleep,
  });

  assert.ok(!('active_users_30d' in values));
  assert.ok(!('platform_managed_users' in values));
  assert.ok(!('platform_managed_rate' in values));
  assert.deepEqual(failures.map((failure) => failure.id).sort(), [
    'active_users_30d',
    'platform_managed_rate',
    'platform_managed_users',
  ]);
});

test('a failing KPI is retried with the 10 s and 30 s waits', async () => {
  const waits: number[] = [];
  const { session } = fakeSession({ failUsers: true });

  await collectAll(config, {
    fetchImpl: fakeFetch(),
    session,
    sleepFn: async (ms) => void waits.push(ms),
  });

  assert.deepEqual(waits.slice(0, 2), [10_000, 30_000]);
});

test('the CI KPI is 1 only for a successful latest run', async () => {
  const run = (conclusion: string) => collectCiKpi(config, { fetchImpl: fakeFetch({ conclusion }) });

  assert.equal(await run('success'), 1);
  assert.equal(await run('failure'), 0);
  assert.equal(await run('cancelled'), 0);
});

test('no finished CI run is a real 0, but a GitHub error is a failure', async () => {
  assert.equal(await collectCiKpi(config, { fetchImpl: fakeFetch({ conclusion: null }) }), 0);
  await assert.rejects(
    collectCiKpi(config, { fetchImpl: fakeFetch({ githubStatus: 403 }) }),
    /GitHub API answered 403/,
  );
});

test('db_storage_used divides by the configurable plan limit', async () => {
  const { session } = fakeSession({ bytes: 268_435_456 });

  assert.equal(await neonKpis.db_storage_used(session, config), 25);
});
