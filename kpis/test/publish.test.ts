import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KPI_CATALOG } from '../src/catalog.ts';
import type { FetchFn } from '../src/collect-http.ts';
import type { PublishTarget } from '../src/config.ts';
import {
  PublishError,
  buildBatch,
  findCatalogProblems,
  sendBatch,
  validateCatalog,
} from '../src/publish.ts';

const target: PublishTarget = {
  env: 'dev',
  supabaseUrl: 'https://kpi.test',
  publishableKey: 'sb_publishable_x',
  projectKey: 'kpi_secret',
};

const fullCatalog = KPI_CATALOG.map((kpi) => ({ ...kpi, deprecated_at: null }));
const json = (status: number, body: unknown = []) =>
  ({ ok: status < 300, status, json: async () => body }) as unknown as Response;
const noSleep = async () => {};

test('a complete catalog has no problems', () => {
  assert.deepEqual(findCatalogProblems(fullCatalog), []);
});

test('reports missing, mismatched and deprecated KPIs', () => {
  const rows = fullCatalog
    .filter((row) => row.id !== 'health_up')
    .map((row) => (row.id === 'db_connected' ? { ...row, unit: '%' } : row))
    .map((row) => (row.id === 'ci_last_run_ok' ? { ...row, deprecated_at: '2026-10-01' } : row));

  const problems = findCatalogProblems(rows);

  assert.equal(problems.length, 3);
  assert.match(problems.join('\n'), /health_up: missing/);
  assert.match(problems.join('\n'), /db_connected: expected health\/1, found health\/%/);
  assert.match(problems.join('\n'), /ci_last_run_ok: deprecated/);
});

test('validateCatalog fails with a clear message when the catalog is incomplete', async () => {
  const fetchImpl: FetchFn = async () => json(200, fullCatalog.slice(0, 9));

  await assert.rejects(validateCatalog(target, { fetchImpl }), /catalog is not ready[\s\S]*missing/);
});

test('validateCatalog sends the project key in X-Project-Key, not Authorization', async () => {
  let seen: Record<string, string> = {};

  await validateCatalog(target, {
    fetchImpl: async (_url, init) => {
      seen = init?.headers as Record<string, string>;
      return json(200, fullCatalog);
    },
  });

  assert.equal(seen['X-Project-Key'], 'kpi_secret');
  assert.equal(seen.apikey, 'sb_publishable_x');
  assert.equal(seen.Authorization, undefined);
});

test('buildBatch shares date, env and run_id and rejects non-numbers', () => {
  const batch = buildBatch({
    values: { health_up: 1, db_connected: 0 },
    date: '2026-10-14',
    env: 'prod',
    runId: 'run-1',
  });

  assert.deepEqual(batch, [
    { kpi_id: 'health_up', date: '2026-10-14', env: 'prod', value: 1, run_id: 'run-1' },
    { kpi_id: 'db_connected', date: '2026-10-14', env: 'prod', value: 0, run_id: 'run-1' },
  ]);
  assert.throws(
    () =>
      buildBatch({
        values: { health_up: Number.NaN },
        date: 'd',
        env: 'prod',
        runId: 'r',
      }),
    PublishError,
  );
});

test('sendBatch posts with ignore-duplicates and the conflict target', async () => {
  let call: { url: string; init?: RequestInit } | undefined;

  await sendBatch(target, [], {
    fetchImpl: async (url, init) => {
      call = { url, init };
      return json(201);
    },
  });

  assert.match(call?.url ?? '', /measurement\?on_conflict=project_id,kpi_id,date,env$/);
  assert.equal(call?.init?.method, 'POST');
  assert.equal(
    (call?.init?.headers as Record<string, string>).Prefer,
    'resolution=ignore-duplicates',
  );
});

test('transient errors are retried with the same body', async () => {
  const bodies: unknown[] = [];
  const statuses = [503, 429, 201];

  await sendBatch(target, [], {
    sleepFn: noSleep,
    fetchImpl: async (_url, init) => {
      bodies.push(init?.body);
      return json(statuses.shift() ?? 201);
    },
  });

  assert.equal(bodies.length, 3);
  assert.equal(new Set(bodies).size, 1);
});

test('network errors are retried too', async () => {
  let calls = 0;

  await sendBatch(target, [], {
    sleepFn: noSleep,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new Error('ECONNRESET');
      return json(201);
    },
  });

  assert.equal(calls, 2);
});

test('400, 401, 403 and 409 fail visibly without retrying', async () => {
  for (const status of [400, 401, 403, 409]) {
    let calls = 0;

    await assert.rejects(
      sendBatch(target, [], {
        sleepFn: noSleep,
        fetchImpl: async () => {
          calls += 1;
          return json(status);
        },
      }),
      (error: unknown) => error instanceof PublishError && error.status === status,
    );
    assert.equal(calls, 1, `status ${status} must not be retried`);
  }
});

test('gives up after the last retry on a persistent 5xx', async () => {
  let calls = 0;

  await assert.rejects(
    sendBatch(target, [], {
      sleepFn: noSleep,
      fetchImpl: async () => {
        calls += 1;
        return json(500);
      },
    }),
    PublishError,
  );
  assert.equal(calls, 4);
});
