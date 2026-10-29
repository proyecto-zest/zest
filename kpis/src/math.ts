export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Nearest-rank percentile: sort, then take the ceil(p * n)-th value (1-based).
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error('Cannot compute a percentile of an empty list');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(Math.ceil(p * sorted.length), 1);
  return sorted[rank - 1];
}

export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot compute the median of an empty list');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function ratioPercent(part: number, total: number): number {
  return total === 0 ? 0 : round2((part / total) * 100);
}

// The platform wants the calendar day in Buenos Aires, never the UTC date.
export function buenosAiresDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(now);
}

export type SleepFn = (ms: number) => Promise<void>;

export const sleep: SleepFn = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  waits?: number[];
  sleepFn?: SleepFn;
}

// Retries a collector; a thrown error means "could not measure", never a 0.
export async function withRetries<T>(
  task: () => Promise<T>,
  { waits = [10_000, 30_000], sleepFn = sleep }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= waits.length; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < waits.length) {
        await sleepFn(waits[attempt]);
      }
    }
  }

  throw lastError;
}
