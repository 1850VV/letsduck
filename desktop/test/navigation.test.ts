import test from 'node:test';
import assert from 'node:assert/strict';
import { localURL, externalURL, proxyURL } from '../src/navigation.js';
test('keeps a stable private application origin while preserving paths and queries', () => {
  assert.equal(proxyURL('duck://app/paint?scheme=abc', 'http://127.0.0.1:1234'), 'http://127.0.0.1:1234/paint?scheme=abc');
  for (const url of ['https://app/paint', 'duck://evil/paint', 'duck://app:8080', 'duck://user@app']) { assert.equal(localURL(url), false); assert.throws(() => proxyURL(url, 'http://127.0.0.1:1234')); }
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'https:' + '//user:pass@example.com', 'duck://app/paint']) assert.equal(externalURL(url), false);
  assert.equal(externalURL('https://example.com/guide'), true);
});
