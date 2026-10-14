import pg from 'pg';

import type { Config } from './config.ts';
import { median, round2 } from './math.ts';

export interface NeonSession {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  close(): Promise<void>;
}

const ACTIVE_USERS_SQL = `
  SELECT COUNT(*)::int AS value
  FROM users u
  WHERE u.updated_at >= now() - interval '30 days'`;

const MANAGED_USERS_SQL = `
  SELECT COUNT(*)::int AS value
  FROM users u
  WHERE u.updated_at >= now() - interval '30 days'
    AND EXISTS (
      SELECT 1
      FROM collections c
      JOIN collection_recipes cr ON cr.collection_id = c.id
      WHERE c.owner_id = u.id
    )`;

// Lazily opened, reused connection. A failed connection is dropped so the next
// attempt reconnects (Neon suspends after 5 idle minutes and wakes up slowly).
export function createNeonSession(connectionString: string): NeonSession {
  let client: pg.Client | undefined;

  async function close(): Promise<void> {
    const current = client;
    client = undefined;
    await current?.end().catch(() => undefined);
  }

  return {
    async query(sql, params) {
      if (!client) {
        const candidate = new pg.Client({
          connectionString,
          connectionTimeoutMillis: 30_000,
          query_timeout: 30_000,
        });
        await candidate.connect();
        client = candidate;
      }

      try {
        return await client.query(sql, params);
      } catch (error) {
        // SQL errors carry a code and keep the connection; network errors do not.
        if ((error as { code?: string }).code === undefined) {
          await close();
        }
        throw error;
      }
    },
    close,
  };
}

type NeonKpi = (session: NeonSession, config: Config) => Promise<number>;

const firstValue = (result: { rows: Record<string, unknown>[] }): number =>
  Number(result.rows[0].value);

export const neonKpis: Record<string, NeonKpi> = {
  active_users_30d: async (session) => firstValue(await session.query(ACTIVE_USERS_SQL)),

  platform_managed_users: async (session) => firstValue(await session.query(MANAGED_USERS_SQL)),

  db_storage_used: async (session, config) => {
    const result = await session.query(
      'SELECT pg_database_size(current_database())::bigint AS value',
    );
    return round2((firstValue(result) / config.storageLimitBytes) * 100);
  },

  // Median round trip of 5 SELECT 1, after one unmeasured warm-up query.
  db_query_latency: async (session) => {
    await session.query('SELECT 1');
    const durations: number[] = [];
    for (let index = 0; index < 5; index++) {
      const startedAt = performance.now();
      await session.query('SELECT 1');
      durations.push(performance.now() - startedAt);
    }
    return round2(median(durations));
  },
};
