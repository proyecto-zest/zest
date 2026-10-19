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

interface PgLikeClient {
  connect(): Promise<unknown>;
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
  on(event: 'error', listener: (error: Error) => void): unknown;
}

type ClientFactory = (connectionString: string) => PgLikeClient;

const defaultFactory: ClientFactory = (connectionString) =>
  new pg.Client({
    connectionString,
    connectionTimeoutMillis: 30_000,
    query_timeout: 30_000,
  }) as unknown as PgLikeClient;

// Lazily opened, reused connection. Neon suspends after 5 idle minutes and can
// cut a connection between retries, so:
//  - an 'error' event on an idle client must be handled (an unhandled one
//    would crash the whole process), and
//  - any failed query drops the connection, whatever the error code is,
//    because a network error (ECONNRESET, 57P01) leaves a dead connection and
//    the next attempt must reconnect instead of reusing it.
export function createNeonSession(
  connectionString: string,
  createClient: ClientFactory = defaultFactory,
): NeonSession {
  let client: PgLikeClient | undefined;

  async function close(): Promise<void> {
    const current = client;
    client = undefined;
    await current?.end().catch(() => undefined);
  }

  async function open(): Promise<PgLikeClient> {
    if (client) {
      return client;
    }

    const candidate = createClient(connectionString);
    candidate.on('error', () => {
      if (client === candidate) {
        client = undefined;
      }
    });

    try {
      await candidate.connect();
    } catch (error) {
      await candidate.end().catch(() => undefined);
      throw error;
    }

    client = candidate;
    return candidate;
  }

  return {
    async query(sql, params) {
      const active = await open();

      try {
        return await active.query(sql, params);
      } catch (error) {
        await close();
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
