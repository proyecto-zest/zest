import { percentile, ratioPercent, round2 } from './math.ts';

const WARMUP_TIMEOUT_MS = 120_000;
const CALL_TIMEOUT_MS = 10_000;
const CALL_COUNT = 20;

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

interface TimedResult {
  ok: boolean;
  status: number | undefined;
  body: { status?: string; db?: string } | undefined;
  durationMs: number;
}

// One GET. Never throws: errors and timeouts are returned as data.
export async function timedGet(
  url: string,
  { timeoutMs, fetchImpl = fetch }: { timeoutMs: number; fetchImpl?: FetchFn },
): Promise<TimedResult> {
  const startedAt = performance.now();

  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await response.text();
    let body: TimedResult['body'];
    try {
      body = JSON.parse(text) as TimedResult['body'];
    } catch {
      body = undefined;
    }
    return {
      ok: response.status === 200,
      status: response.status,
      body,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    const timedOut = name === 'TimeoutError' || name === 'AbortError';
    return {
      ok: false,
      status: undefined,
      body: undefined,
      durationMs: timedOut ? timeoutMs : performance.now() - startedAt,
    };
  }
}

// Wakes Render up (first request after idle takes about a minute). Not measured.
async function warmUp(url: string, fetchImpl: FetchFn): Promise<TimedResult> {
  const first = await timedGet(url, { timeoutMs: WARMUP_TIMEOUT_MS, fetchImpl });

  if (first.status !== undefined) {
    return first;
  }
  return timedGet(url, { timeoutMs: WARMUP_TIMEOUT_MS, fetchImpl });
}

export interface HttpKpis {
  health_up: number;
  db_connected: number;
  health_latency_p95: number;
  health_error_rate: number;
}

// KPIs 4, 5, 7 and 8. A dead backend is real data (0), not a reporting failure.
export async function collectHttpKpis(
  backendUrl: string,
  { fetchImpl = fetch, calls = CALL_COUNT }: { fetchImpl?: FetchFn; calls?: number } = {},
): Promise<HttpKpis> {
  const url = `${backendUrl}/health`;
  const warmup = await warmUp(url, fetchImpl);

  const results: TimedResult[] = [];
  for (let index = 0; index < calls; index++) {
    results.push(await timedGet(url, { timeoutMs: CALL_TIMEOUT_MS, fetchImpl }));
  }

  const failed = results.filter((result) => !result.ok).length;

  return {
    health_up: warmup.ok && warmup.body?.status === 'ok' ? 1 : 0,
    db_connected: warmup.body?.db === 'connected' ? 1 : 0,
    health_latency_p95: round2(percentile(results.map((result) => result.durationMs), 0.95)),
    health_error_rate: ratioPercent(failed, calls),
  };
}
