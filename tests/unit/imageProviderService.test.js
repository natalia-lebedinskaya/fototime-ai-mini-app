'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractStyleList, getConfig } = require('../../src/server/services/imageProviderService');

test('extractStyleList supports the documented catalog envelopes', () => {
  const styles = [{ id: 'style-1' }];
  assert.deepEqual(extractStyleList(styles), styles);
  assert.deepEqual(extractStyleList({ styles }), styles);
  assert.deepEqual(extractStyleList({ items: styles }), styles);
  assert.deepEqual(extractStyleList({ data: { styles } }), styles);
  assert.deepEqual(extractStyleList({ data: styles }), styles);
  assert.deepEqual(extractStyleList({}), []);
});

test('getConfig validates and normalizes provider settings', () => {
  const previous = { ...process.env };
  try {
    delete process.env.IMAGE_PROVIDER_BASE_URL;
    assert.throws(() => getConfig(), { code: 'IMAGE_PROVIDER_NOT_CONFIGURED' });

    process.env.IMAGE_PROVIDER_BASE_URL = 'https://images.example.test/api/';
    process.env.IMAGE_PROVIDER_API_KEY = 'test-key';
    process.env.IMAGE_PROVIDER_MAX_ATTEMPTS = '12';
    process.env.IMAGE_PROVIDER_DRY_RUN = 'true';

    assert.deepEqual(getConfig({ requireApiKey: true }), {
      baseUrl: 'https://images.example.test/api',
      apiKey: 'test-key',
      pollIntervalMs: 3000,
      maxAttempts: 12,
      requestTimeoutMs: 30000,
      dryRun: true,
    });
  } finally {
    process.env = previous;
  }
});
