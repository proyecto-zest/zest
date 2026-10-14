import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KPI_IDS } from '../src/catalog.ts';
import type { KpiFailure, KpiValues } from '../src/catalog.ts';
import type { Config } from '../src/config.ts';
import { runReport } from '../src/run.ts';
import type { RunDeps } from '../src/run.ts';

const allValues: KpiValues = Object.fromEntries(KPI_IDS.map((id, index) => [id, index]));

const baseConfig: Config = {
  env: 'prod',
  dryRun: false,
  backendUrl: 'https://api.test',
  neonUrl: 'postgres://unused',
  githubToken: 'token',
  githubRepo: 'proyecto-zest/zest',
  storageLimitBytes: 1024 ** 3,
  publishing: { supabaseUrl: 'https://kpi.test', publishableKey: 'pk', projectKey: 'key' },
};

function harness({
  values = allValues,
  failures = [] as KpiFailure[],
  stored,
}: { values?: KpiValues; failures?: KpiFailure[]; stored?: string[] } = {}) {
  const calls = {
    send: [] as { kpi_id: string; date: string; run_id: string }[][],
    files: [] as { path: string; content: string }[],
    validate: 0,
  };

  const deps: RunDeps = {
    log: () => {},
    now: new Date('2026-10-14T11:17:00Z'),
    runId: 'run-1',
    collect: async () => ({ values, failures }),
    validate: async () => {
      calls.validate += 1;
    },
    send: async (_target, batch) => {
      calls.send.push(batch);
    },
    verify: async () => (stored ?? Object.keys(values)).map((kpi_id) => ({ kpi_id })),
    writeFile: (path, content) => void calls.files.push({ path, content }),
  };

  return { calls, deps };
}

test('sends the 10 KPIs, saves a copy and exits 0 when the day is complete', async () => {
  const { calls, deps } = harness();

  assert.equal(await runReport(baseConfig, deps), 0);
  assert.equal(calls.send.length, 1);
  assert.equal(calls.send[0].length, 10);
  assert.ok(calls.send[0].every((row) => row.date === '2026-10-14' && row.run_id === 'run-1'));
  assert.equal(calls.files[0].path, 'kpi-batch-prod-2026-10-14.json');
});

test('one failure sends the other 9 and finishes red', async () => {
  const partial = Object.fromEntries(
    Object.entries(allValues).filter(([id]) => id !== 'ci_last_run_ok'),
  );
  const { calls, deps } = harness({
    values: partial,
    failures: [{ id: 'ci_last_run_ok', reason: 'GitHub API answered 403' }],
  });

  assert.equal(await runReport(baseConfig, deps), 1);
  assert.equal(calls.send[0].length, 9);
  assert.ok(!calls.send[0].some((row) => row.kpi_id === 'ci_last_run_ok'));
});

test('two or more failures send nothing', async () => {
  const { calls, deps } = harness({
    values: {},
    failures: [
      { id: 'active_users_30d', reason: 'x' },
      { id: 'ci_last_run_ok', reason: 'y' },
    ],
  });

  assert.equal(await runReport(baseConfig, deps), 1);
  assert.equal(calls.send.length, 0);
  assert.equal(calls.validate, 0);
});

test('a dry run measures and prints but never validates, sends or saves', async () => {
  const { calls, deps } = harness();

  assert.equal(await runReport({ ...baseConfig, dryRun: true }, deps), 0);
  assert.equal(calls.send.length, 0);
  assert.equal(calls.validate, 0);
  assert.equal(calls.files.length, 0);
});

test('exits 1 when the platform did not store every KPI after sending', async () => {
  const { deps } = harness({ stored: KPI_IDS.slice(0, 8) as string[] });

  assert.equal(await runReport(baseConfig, deps), 1);
});

test('the catalog is validated before anything is sent', async () => {
  const { calls, deps } = harness();
  deps.validate = async () => {
    throw new Error('catalog is not ready');
  };

  await assert.rejects(runReport(baseConfig, deps), /catalog is not ready/);
  assert.equal(calls.send.length, 0);
});
