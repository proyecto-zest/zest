import { KPI_IDS } from './catalog.ts';
import type { KpiFailure, KpiValues } from './catalog.ts';
import { collectCiKpi } from './collect-ci.ts';
import { describeError } from './errors.ts';
import { collectHttpKpis } from './collect-http.ts';
import type { FetchFn } from './collect-http.ts';
import { createNeonSession, neonKpis } from './collect-neon.ts';
import type { NeonSession } from './collect-neon.ts';
import type { Config } from './config.ts';
import { ratioPercent, withRetries } from './math.ts';
import type { SleepFn } from './math.ts';

export interface CollectDeps {
  sleepFn?: SleepFn;
  fetchImpl?: FetchFn;
  session?: NeonSession;
  log?: (message: string) => void;
}

export interface Collected {
  values: KpiValues;
  failures: KpiFailure[];
}

const NEON_KPI_IDS = [
  'active_users_30d',
  'platform_managed_users',
  'db_storage_used',
  'db_query_latency',
];

// `values` only holds measured KPIs: one that could not be measured is a
// failure, never a filler 0.
export async function collectAll(config: Config, deps: CollectDeps = {}): Promise<Collected> {
  const { sleepFn, fetchImpl = fetch, log = () => {} } = deps;
  const session = deps.session ?? createNeonSession(config.neonUrl);
  const values: KpiValues = {};
  const failures: KpiFailure[] = [];
  const retryOptions = sleepFn ? { sleepFn } : {};

  async function measure(id: string, task: () => Promise<number>): Promise<void> {
    try {
      values[id] = await withRetries(task, retryOptions);
    } catch (error) {
      const reason = describeError(error);
      failures.push({ id, reason: reason.slice(0, 300) });
      log(`KPI ${id} could not be measured: ${reason}`);
    }
  }

  Object.assign(values, await collectHttpKpis(config.backendUrl, { fetchImpl, ...(sleepFn ? { sleepFn } : {}) }));

  try {
    for (const id of NEON_KPI_IDS) {
      await measure(id, () => neonKpis[id](session, config));
    }
  } finally {
    await session.close();
  }

  await measure('ci_last_run_ok', () => collectCiKpi(config, { fetchImpl }));

  if ('platform_managed_users' in values && 'active_users_30d' in values) {
    values.platform_managed_rate = ratioPercent(
      values.platform_managed_users,
      values.active_users_30d,
    );
  } else {
    const missing = ['platform_managed_users', 'active_users_30d'].filter((id) => !(id in values));
    failures.push({
      id: 'platform_managed_rate',
      reason: `cannot be calculated: ${missing.join(' and ')} could not be measured`,
      derived: true,
    });
  }

  const ordered: KpiValues = {};
  for (const id of KPI_IDS) {
    if (id in values) ordered[id] = values[id];
  }

  return { values: ordered, failures };
}
