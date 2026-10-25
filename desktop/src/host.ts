import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { startHost } from './application.js';

const root = resolve(import.meta.dirname, '../..');
const manifest = JSON.parse(readFileSync(process.env.DUCK_ASSEMBLY_MANIFEST || join(root, 'scripts/assembly-assets.json'), 'utf8'));
const options = {
  assets: process.env.DUCK_ASSETS || join(root, 'assets'), frontend: process.env.DUCK_FRONTEND || join(root, 'frontend'),
  db: process.env.DUCK_PERSONAL_DB, legacy: process.env.DUCK_LEGACY_DB,
  assembly: Object.keys(manifest.files), version: process.env.DUCK_VERSION || '0.1.0-beta.1', port: Number(process.env.DUCK_PORT || 0),
};
const parent = (process as unknown as { parentPort?: { postMessage: (v: unknown) => void; on: (event: string, fn: (e: { data: any }) => void) => void } }).parentPort;
try {
  const host = await startHost(options);
  if (parent) parent.postMessage({ kind: 'ready', url: host.url }); else console.log(JSON.stringify({ kind: 'ready', url: host.url }));
  let quitting = false;
  const stop = async () => { if (quitting) return; quitting = true; await host.close(); process.exit(0); };
  process.on('SIGTERM', () => void stop()); process.on('SIGINT', () => void stop());
  parent?.on('message', ({ data }) => { if (data?.kind === 'stop') void stop(); else if (data?.kind === 'busy') parent.postMessage({ kind: 'busy', id: data.id, busy: host.busy }); });
} catch (error) { console.error(error); parent?.postMessage({ kind: 'failed', message: String(error) }); process.exitCode = 1; }
