import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitForVerifiedSession } from '../src/lib/api';

test('delivery verification retries pending orders, rejects invalid requests, and cancels waits', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json(calls === 1 ? { verified: false } : { verified: true, token: 'private-token' });
    };
    const result = await waitForVerifiedSession('session', new AbortController().signal);
    assert.equal(result.token, 'private-token');
    assert.equal(calls, 2);

    calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ error: 'Invalid session' }, { status: 400 }); };
    await assert.rejects(waitForVerifiedSession('invalid', new AbortController().signal), /Invalid session/);
    assert.equal(calls, 1);

    const controller = new AbortController();
    globalThis.fetch = async () => Response.json({ verified: false });
    const pending = waitForVerifiedSession('session', controller.signal);
    setTimeout(() => controller.abort(), 10);
    await assert.rejects(pending, { name: 'AbortError' });

    calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ verified: false }); };
    await assert.rejects(waitForVerifiedSession('session', new AbortController().signal), /Please do not purchase again/);
    assert.equal(calls, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
