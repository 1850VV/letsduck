import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sameOriginUrl, assetUrl, apiUrl, assemblyAssetUrl } from '../../frontend/shared/url.js';

test('root URLs survive nested emitted chunks and retain custom protocol hosts', () => {
  for (const base of ['https://example.test/static/chunks/page-abcd.js', 'duck://app/static/chunks/page-abcd.js']) {
    const origin = new URL(base);
    assert.equal(sameOriginUrl('/paint?from=home#scheme=x', base).href, `${origin.protocol}//${origin.host}/paint?from=home#scheme=x`);
    assert.equal(assetUrl('geometry.positions.bin', base).pathname, '/assets/geometry.positions.bin');
    assert.equal(apiUrl('/catalog', base).pathname, '/api/catalog');
    assert.equal(assemblyAssetUrl('hardware-v2/head.glb', base).pathname, '/assemble/assets/hardware-v2/head.glb');
  }
});
