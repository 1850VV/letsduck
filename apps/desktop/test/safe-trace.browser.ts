/**
 * After build:desktop: node --import tsx apps/desktop/test/safe-trace.browser.ts
 * Real Electron check: a host credential canary never enters generated trace entries.
 */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { unzipSync } from 'fflate';
import { desktopScope, object, root } from '../scripts/check-support.js';

const key = 'DUCK_UNNECESSARY_CREDENTIAL_CANARY';
const canary = 'desktop-trace-isolation-canary-61e4d2';
const previous = process.env[key], previousExecutable = process.env.DUCK_APP_EXECUTABLE;
process.env[key] = canary; delete process.env.DUCK_APP_EXECUTABLE;
const output = resolve(process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-safe-trace'));
await mkdir(output, { recursive: true });
const scope = await desktopScope('duck-safe-trace-');
let entriesChecked = 0;
try {
  const frontend = join(scope.temporary, 'frontend'); await mkdir(frontend);
  await writeFile(join(frontend, 'home.html'), '<!doctype html><html><body><header class="home-top"><a class="home-brand">Synthetic trace fixture</a></header><button id="check">Trace ready</button></body></html>');
  scope.env.DUCK_FRONTEND = frontend; scope.env.DUCK_ASSETS = join(scope.temporary, 'absent-assets');
  const app = await scope.launch(), page = await app.firstWindow();
  assert.equal(await app.evaluate((_electron, name) => Object.hasOwn(process.env, name), key), false, 'Canary excluded from the actual child');
  await app.context().tracing.start({ screenshots: true, snapshots: true });
  await page.locator('#check').click(); await page.screenshot({ path: join(output, 'fixture.png'), timeout: 30_000 });
  const archive = join(output, 'trace.zip'); await app.context().tracing.stop({ path: archive });
  const needle = Buffer.from(canary);
  for (const [name, bytes] of Object.entries(unzipSync(await readFile(archive)))) {
    assert.equal(Buffer.from(bytes).includes(needle), false, 'Credential canary absent from every generated archive entry');
    entriesChecked++;
    if (name.endsWith('.trace')) for (const line of new TextDecoder().decode(bytes).split('\n').filter(Boolean)) {
      const value: unknown = JSON.parse(line);
      if (object(value) && value.type === 'context-options' && object(value.options) && Array.isArray(value.options.env)) {
        assert.equal(value.options.env.some((entry: unknown) => object(entry) && entry.name === key), false, 'Launch metadata did not contain the canary key');
      }
    }
  }
  assert.ok(entriesChecked > 0); await scope.close(app);
} finally {
  await scope.dispose();
  if (previous === undefined) delete process.env[key]; else process.env[key] = previous;
  if (previousExecutable === undefined) delete process.env.DUCK_APP_EXECUTABLE; else process.env.DUCK_APP_EXECUTABLE = previousExecutable;
}
await writeFile(join(output, 'result.json'), JSON.stringify({ actualElectron: true, canaryExcludedBeforeCapture: true, canaryAbsentFromGeneratedArchive: true, entriesChecked, ownedPids: [...scope.pids], ownedProcessesExited: true, temporaryDataRemoved: true }, null, 2));
console.log(JSON.stringify({ actualElectron: true, canaryAbsentFromGeneratedArchive: true, entriesChecked, ownedProcessesExited: true }));
