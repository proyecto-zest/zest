import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadConfig } from '../src/config.ts';

const base = {
  BACKEND_URL: 'https://api.test/',
  NEON_READONLY_URL: 'postgres://reader',
  GITHUB_TOKEN: 'token',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
  SUPABASE_URL_DEV: 'https://dev.supabase.test/',
  SUPABASE_URL_PROD: 'https://prod.supabase.test',
  PROJECT_KEY_DEV: 'dev-key',
  PROJECT_KEY_PROD: 'prod-key',
};

test('each environment uses its own url and key', () => {
  assert.deepEqual(loadConfig(base, ['--env', 'dev']).publishing, {
    supabaseUrl: 'https://dev.supabase.test',
    publishableKey: 'sb_publishable_x',
    projectKey: 'dev-key',
  });
  assert.equal(loadConfig(base, ['--env', 'prod']).publishing?.projectKey, 'prod-key');
});

test('it never falls back to the prod key when the dev key is missing', () => {
  const env = { ...base, PROJECT_KEY_DEV: '' };

  assert.throws(
    () => loadConfig(env, ['--env', 'dev']),
    /Missing required environment variable PROJECT_KEY_DEV/,
  );
});

test('qa has no credentials configured and fails with a clear message', () => {
  assert.throws(
    () => loadConfig(base, ['--env', 'qa']),
    /Missing required environment variable SUPABASE_URL_QA/,
  );
});

test('a dry run does not need the publishing credentials', () => {
  const { SUPABASE_PUBLISHABLE_KEY: _a, SUPABASE_URL_PROD: _b, PROJECT_KEY_PROD: _c, ...env } = base;

  const config = loadConfig(env, ['--dry-run']);

  assert.equal(config.dryRun, true);
  assert.equal(config.publishing, undefined);
  assert.equal(config.backendUrl, 'https://api.test');
});

test('rejects an unknown environment', () => {
  assert.throws(() => loadConfig(base, ['--env', 'staging']), /Invalid environment/);
});
