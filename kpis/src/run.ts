import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { KPI_IDS } from './catalog.ts';
import type { Collected } from './collect.ts';
import { collectAll } from './collect.ts';
import { loadConfig } from './config.ts';
import type { Config, PublishTarget } from './config.ts';
import { buenosAiresDate } from './math.ts';
import { buildBatch, readBack, sendBatch, validateCatalog } from './publish.ts';
import type { MeasurementRow } from './publish.ts';

export interface RunDeps {
  collect?: (config: Config, deps: { log: (message: string) => void }) => Promise<Collected>;
  validate?: (target: PublishTarget) => Promise<void>;
  send?: (target: PublishTarget, batch: MeasurementRow[]) => Promise<void>;
  verify?: (
    target: PublishTarget,
    query: { date: string; env: string },
  ) => Promise<{ kpi_id: string }[]>;
  now?: Date;
  runId?: string;
  writeFile?: (path: string, content: string) => void;
  log?: (message: string) => void;
}

// Failure policy: 0 failures -> send all; 1 -> send the rest and finish red so
// the next run of the day completes it; 2 or more -> send nothing.
export async function runReport(config: Config, deps: RunDeps = {}): Promise<number> {
  const {
    collect = collectAll,
    validate = validateCatalog,
    send = sendBatch,
    verify = readBack,
    now = new Date(),
    runId = randomUUID(),
    writeFile = (path: string, content: string) => writeFileSync(path, content),
    log = console.log,
  } = deps;

  const date = buenosAiresDate(now);
  const { values, failures } = await collect(config, { log });

  log(`KPIs for ${date} (${config.env}):`);
  for (const id of KPI_IDS) {
    log(`  ${id.padEnd(24)} ${id in values ? values[id] : 'NOT MEASURED'}`);
  }
  for (const failure of failures) {
    log(`  failure: ${failure.id}: ${failure.reason}`);
  }

  if (config.dryRun) {
    log('Dry run: nothing was sent.');
    return failures.length === 0 ? 0 : 1;
  }

  // A derived KPI is a consequence of one failure, not a second failure.
  const rootFailures = failures.filter((failure) => !failure.derived);

  if (rootFailures.length >= 2) {
    log(`${rootFailures.length} KPIs could not be measured: nothing is sent. Re-run the workflow today.`);
    return 1;
  }

  if (!config.publishing) {
    throw new Error('Publishing credentials are missing');
  }

  const target: PublishTarget = { env: config.env, ...config.publishing };
  const batch = buildBatch({ values, date, env: config.env, runId });
  writeFile(`kpi-batch-${config.env}-${date}.json`, JSON.stringify(batch, null, 2));

  await validate(target);
  await send(target, batch);
  log(`Sent ${batch.length} KPIs (run ${runId}).`);

  const stored = await verify(target, { date, env: config.env });
  const storedIds = new Set(stored.map((row) => row.kpi_id));
  const missing = KPI_IDS.filter((id) => !storedIds.has(id));

  if (missing.length > 0) {
    log(`Day incomplete, missing: ${missing.join(', ')}`);
    return 1;
  }

  log('Day complete: all 10 KPIs are stored.');
  return 0;
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(entry).href) {
  try {
    process.exitCode = await runReport(loadConfig());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`KPI report failed: ${message}`);
    process.exitCode = 1;
  }
}
