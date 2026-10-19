import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';

import { createNeonSession } from '../src/collect-neon.ts';

class FakeClient extends EventEmitter {
  static instances: FakeClient[] = [];
  ended = false;
  failNextWith: Error | undefined;

  constructor() {
    super();
    FakeClient.instances.push(this);
  }

  async connect() {}

  async query() {
    if (this.failNextWith) {
      const error = this.failNextWith;
      this.failNextWith = undefined;
      throw error;
    }
    return { rows: [{ value: 1 }] };
  }

  async end() {
    this.ended = true;
  }
}

function newSession() {
  FakeClient.instances = [];
  return createNeonSession('postgres://unused', () => new FakeClient());
}

test('reuses one connection while queries succeed', async () => {
  const session = newSession();

  await session.query('SELECT 1');
  await session.query('SELECT 1');

  assert.equal(FakeClient.instances.length, 1);
});

test('an error event on an idle connection does not crash and forces a reconnect', async () => {
  const session = newSession();
  await session.query('SELECT 1');

  assert.doesNotThrow(() => FakeClient.instances[0].emit('error', new Error('terminated')));
  await session.query('SELECT 1');

  assert.equal(FakeClient.instances.length, 2);
});

test('network errors that carry a code drop the connection too', async () => {
  for (const code of ['ECONNRESET', '57P01']) {
    const session = newSession();
    await session.query('SELECT 1');
    FakeClient.instances[0].failNextWith = Object.assign(new Error('lost'), { code });

    await assert.rejects(session.query('SELECT 1'), /lost/);
    assert.equal(FakeClient.instances[0].ended, true, `${code} must close the connection`);

    await session.query('SELECT 1');
    assert.equal(FakeClient.instances.length, 2, `${code} must reconnect, not reuse the dead one`);
  }
});
