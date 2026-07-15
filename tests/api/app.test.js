'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

let server;
let baseUrl;
let originalCwd;
let temporaryRoot;

test.before(async () => {
  originalCwd = process.cwd();
  temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fot-ai-test-'));
  process.chdir(temporaryRoot);
  process.env.NODE_ENV = 'test';
  process.env.ALLOW_LOCAL_AUTH = 'true';
  process.env.FOTOTIME_SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  process.env.ADMIN_PIN = '951357';
  delete process.env.IMAGE_PROVIDER_BASE_URL;

  const { createApp } = require('../../src/server/server');
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server)
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  process.chdir(originalCwd);
  await fs.rm(temporaryRoot, { recursive: true, force: true });
});

test('health endpoint reports the release version', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'fot-ai', version: '1.1.0' });
});

test('admin PIN verification rejects invalid input and accepts configured input', async () => {
  const invalid = await fetch(`${baseUrl}/api/admin-pin/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pin: '000000' }),
  });
  assert.equal(invalid.status, 403);

  const valid = await fetch(`${baseUrl}/api/admin-pin/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pin: '951357' }),
  });
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { ok: true });
});

test('browser identity can open state and receives the fallback catalog', async () => {
  const identityResponse = await fetch(`${baseUrl}/api/fototime/identity/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'web_test_device_123456', username: 'qa-user', name: 'QA User' }),
  });
  assert.equal(identityResponse.status, 200);
  const identity = await identityResponse.json();
  assert.ok(identity.sessionToken);

  const stateResponse = await fetch(`${baseUrl}/api/fototime/state`, {
    headers: { 'x-fot-session': identity.sessionToken },
  });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.version, '1.1.0');
  assert.equal(state.user.id, 'web_test_device_123456');
  assert.ok(state.styles.length >= 10);

  const generationResponse = await fetch(`${baseUrl}/api/fototime/generate`, {
    method: 'POST',
    headers: { 'x-fot-session': identity.sessionToken },
    body: new FormData(),
  });
  assert.equal(generationResponse.status, 400);
  assert.equal((await generationResponse.json()).code, 'NO_FILE');
});

test('unknown API routes return a structured 404', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'NOT_FOUND');
});
