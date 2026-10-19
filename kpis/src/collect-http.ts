import { percentile, ratioPercent, round2, sleep } from './math.ts';
import type { SleepFn } from './math.ts';

const WARMUP_TIMEOUT_MS = 120_000;
const WARMUP_BUDGET_MS = 150_000;
const WARMUP_PAUSE_MS = 5_000;
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
    const ok = response.status === 200;
    return {
      ok,
      status: response.status,
      body,
      // A failed call counts as the full timeout, like a timeout does, so a
      // backend that fails fast cannot look fast.
      durationMs: ok ? performance.now() - startedAt : timeoutMs,
    };
  } catch {
    return { ok: false, status: undefined, body: undefined, durationMs: timeoutMs };
  }
}

interface Clock {
  sleepFn: SleepFn;
  now: () => number;
}

// Wakes Render up (first request after idle takes about a minute). Not measured.
// Waits until /health answers 200, or the time budget runs out: while Render
// is starting it can answer 502/503 or reset the connection, and that must not
// be mistaken for a real outage. Always makes at least one retry.
async function warmUp(url: string, fetchImpl: FetchFn, clock: Clock): Promise<TimedResult> {
  const deadline = clock.now() + WARMUP_BUDGET_MS;
  let last = await timedGet(url, { timeoutMs: WARMUP_TIMEOUT_MS, fetchImpl });

  for (let retries = 0; !last.ok; retries++) {
    if (retries >= 1 && clock.now() + WARMUP_PAUSE_MS >= deadline) {
      break;
    }
    await clock.sleepFn(WARMUP_PAUSE_MS);
    last = await timedGet(url, { timeoutMs: WARMUP_TIMEOUT_MS, fetchImpl });
  }

  return last;
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
  {
    fetchImpl = fetch,
    calls = CALL_COUNT,
    sleepFn = sleep,
    now = () => performance.now(),
  }: { fetchImpl?: FetchFn; calls?: number; sleepFn?: SleepFn; now?: () => number } = {},
): Promise<HttpKpis> {
  const url = `${backendUrl}/health`;
  const warmup = await warmUp(url, fetchImpl, { sleepFn, now });

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
