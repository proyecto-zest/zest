import { KPI_CATALOG } from './catalog.ts';
import type { KpiValues } from './catalog.ts';
import type { FetchFn } from './collect-http.ts';
import type { PublishTarget } from './config.ts';
import { sleep } from './math.ts';
import type { SleepFn } from './math.ts';

const RETRY_WAITS_MS = [5_000, 15_000, 45_000];

export class PublishError extends Error {
  status: number | undefined;
  retryable: boolean;

  constructor(message: string, status?: number, retryable = false) {
    super(message);
    this.name = 'PublishError';
    this.status = status;
    this.retryable = retryable;
  }
}

export interface CatalogRow {
  id: string;
  kind: string;
  unit: string;
  deprecated_at: string | null;
}

export interface MeasurementRow {
  kpi_id: string;
  date: string;
  env: string;
  value: number;
  run_id: string;
}

interface Deps {
  fetchImpl?: FetchFn;
  sleepFn?: SleepFn;
}

// The key goes in X-Project-Key: Authorization would be parsed as a JWT.
function headers(
  { publishableKey, projectKey }: PublishTarget,
  extra: Record<string, string> = {},
): Record<string, string> {
  return { apikey: publishableKey, 'X-Project-Key': projectKey, ...extra };
}

const isTransient = (status: number): boolean => status === 429 || status >= 500;

async function request(url: string, init: RequestInit, fetchImpl: FetchFn): Promise<Response> {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new PublishError('Network error talking to the KPI API', undefined, true);
  }
}

// Every expected id must exist with the expected kind and unit, not deprecated.
export function findCatalogProblems(rows: CatalogRow[]): string[] {
  const problems: string[] = [];
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const expected of KPI_CATALOG) {
    const row = byId.get(expected.id);
    if (!row) {
      problems.push(`${expected.id}: missing from the catalog`);
    } else if (row.kind !== expected.kind || row.unit !== expected.unit) {
      problems.push(
        `${expected.id}: expected ${expected.kind}/${expected.unit}, found ${row.kind}/${row.unit}`,
      );
    } else if (row.deprecated_at) {
      problems.push(`${expected.id}: deprecated`);
    }
  }

  return problems;
}

export async function validateCatalog(
  target: PublishTarget,
  { fetchImpl = fetch }: Deps = {},
): Promise<void> {
  const url = `${target.supabaseUrl}/rest/v1/kpi_catalog?select=id,kind,unit,deprecated_at&order=id`;
  const response = await request(url, { headers: headers(target) }, fetchImpl);

  if (!response.ok) {
    throw new PublishError(
      `Could not read the KPI catalog (HTTP ${response.status})`,
      response.status,
      isTransient(response.status),
    );
  }

  const problems = findCatalogProblems((await response.json()) as CatalogRow[]);

  if (problems.length > 0) {
    throw new PublishError(
      `The ${target.env} catalog is not ready:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

export function buildBatch(input: {
  values: KpiValues;
  date: string;
  env: string;
  runId: string;
}): MeasurementRow[] {
  return Object.entries(input.values).map(([kpiId, value]) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new PublishError(`KPI ${kpiId} has a non-numeric value`);
    }
    return { kpi_id: kpiId, date: input.date, env: input.env, value, run_id: input.runId };
  });
}

// Resending the same body and run_id is safe: accepted rows are ignored.
export async function sendBatch(
  target: PublishTarget,
  batch: MeasurementRow[],
  { fetchImpl = fetch, sleepFn = sleep }: Deps = {},
): Promise<void> {
  const url = `${target.supabaseUrl}/rest/v1/measurement?on_conflict=project_id,kpi_id,date,env`;
  const init: RequestInit = {
    method: 'POST',
    headers: headers(target, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    }),
    body: JSON.stringify(batch),
  };

  for (let attempt = 0; ; attempt++) {
    let failure: PublishError;

    try {
      const response = await request(url, init, fetchImpl);
      if (response.ok) {
        return;
      }
      failure = new PublishError(
        `KPI API rejected the batch (HTTP ${response.status})`,
        response.status,
        isTransient(response.status),
      );
    } catch (error) {
      failure = error as PublishError;
    }

    if (!failure.retryable || attempt >= RETRY_WAITS_MS.length) {
      throw failure;
    }
    await sleepFn(RETRY_WAITS_MS[attempt]);
  }
}

// Reads back what the platform stored for the day, to confirm it arrived.
export async function readBack(
  target: PublishTarget,
  { date, env }: { date: string; env: string },
  { fetchImpl = fetch }: Deps = {},
): Promise<{ kpi_id: string; value: number }[]> {
  const url =
    `${target.supabaseUrl}/rest/v1/measurement?select=kpi_id,value` +
    `&date=eq.${date}&env=eq.${env}`;
  const response = await request(url, { headers: headers(target) }, fetchImpl);

  if (!response.ok) {
    throw new PublishError(
      `Could not read back the measurements (HTTP ${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as { kpi_id: string; value: number }[];
}
