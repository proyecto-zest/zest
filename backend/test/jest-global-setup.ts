import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import './load-test-env';
import {
  assertIsolatedTestDatabase,
  ensureTestDatabaseExists,
} from './test-database';

export default async function globalSetup(): Promise<void> {
  if (process.env.RUN_DATABASE_TESTS !== 'true') {
    return;
  }

  assertIsolatedTestDatabase();
  await ensureTestDatabaseExists();
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  execFileSync(npmCommand, ['run', 'prisma:migrate:deploy'], {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
