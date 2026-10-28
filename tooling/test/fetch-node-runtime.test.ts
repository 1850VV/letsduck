import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { fetchNodeRuntime } from '../src/fetch-node-runtime.js';

const filename = 'node-v24.20.0-win-x64.zip';
const bytes = zipSync({
  'node-v24.20.0-win-x64/node.exe': Buffer.from('owned synthetic runtime'),
  'node-v24.20.0-win-x64/LICENSE': Buffer.from('owned synthetic license'),
  'node-v24.20.0-win-x64/node_modules/npm/package.json': Buffer.from('{}'),
});
const checksum = createHash('sha256').update(bytes).digest('hex');
const fixtureFetch = (hash = checksum): typeof fetch => async input => {
  const url = String(input);
  assert.ok(url.startsWith('https://nodejs.org/dist/v24.20.0/'));
  if (url.endsWith('SHASUMS256.txt')) return new Response(hash + '  ' + filename + '\n');
  assert.ok(url.endsWith(filename));
  return new Response(bytes);
};

test('retired Intel Mac runtime is refused before download or destination creation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-node-retired-'));
  let requests = 0;
  try {
    await assert.rejects(fetchNodeRuntime({platform:'darwin',arch:'x64',target:join(root,'runtime'),fetcher:async input=>{requests++;return fixtureFetch()(input);}}), /Only Windows x64 and macOS arm64/);
    assert.equal(requests,0);assert.deepEqual(await readdir(root),[]);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('official Node archive checksum precedes extraction; only binary and license enter the portable runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-node-fetch-'));
  try {
    const result = await fetchNodeRuntime({ platform: 'win32', arch: 'x64', target: join(root, 'runtime'), fetcher: fixtureFetch() });
    assert.equal(result.version, '24.20.0'); assert.equal(result.sha256, checksum);
    assert.equal(result.source, 'https://nodejs.org/dist/v24.20.0/' + filename);
    assert.deepEqual((await readdir(result.directory)).sort(), ['LICENSE', 'node.exe']);
    assert.equal(await readFile(result.executable, 'utf8'), 'owned synthetic runtime');
    await assert.rejects(fetchNodeRuntime({ platform: 'win32', arch: 'x64', target: result.directory, fetcher: fixtureFetch() }), /empty|exist/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('mismatched or missing official checksums never publish a runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-node-fetch-reject-'));
  try {
    for (const hash of ['0'.repeat(64), '']) {
      const target = join(root, hash ? 'mismatch' : 'missing');
      await assert.rejects(fetchNodeRuntime({ platform: 'win32', arch: 'x64', target, fetcher: fixtureFetch(hash) }), /checksum/i);
      await assert.rejects(readdir(target), { code: 'ENOENT' });
    }
    assert.deepEqual(await readdir(root), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});
